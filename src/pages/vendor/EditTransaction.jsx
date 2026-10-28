import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionById, updateTransaction } from '../../services/transactionService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import { formatMoney } from '../../utils/format';

export default function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // form state mirrors editable fields
  const [form, setForm] = useState({ type: '', amount: '', customer_reference: '' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getTransactionById(id);
        setTransaction(data);
        setForm({
          type: data.type || '',
          amount: data.amount?.toString() || '',
          customer_reference: data.customer_reference || ''
        });
      } catch (e) {
        if (e.response && (e.response.status === 403 || e.response.status === 404)) {
          setError({ message: 'Transaction not found or you do not have permission.' });
        } else {
          setError({ message: e.message || 'Failed to load transaction.' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const validate = () => {
    if (!form.type) return 'Select a transaction type.';
    if (!/^\d+(?:\.\d{1,2})?$/.test(form.amount.trim()))
      return 'Enter a valid positive amount with up to two decimals.';
    const amt = Number(form.amount);
    if (amt <= 0 || amt > 1000000000) return 'Amount must be between 0 and 1,000,000,000.';
    if (form.customer_reference && form.customer_reference.trim().length > 100)
      return 'Customer reference must be 100 characters or fewer.';
    return '';
  };

  const handleChange = (field) => (e) => {
    setForm((cur) => ({ ...cur, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vErr = validate();
    if (vErr) { setError({ message: vErr }); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type: form.type,
        amount: form.amount.trim(),
        ...(form.customer_reference ? { customer_reference: form.customer_reference.trim() } : {})
      };
      await updateTransaction(id, payload);
      navigate(`/vendor/transactions/${id}`);
    } catch (reqErr) {
      if (reqErr.response && reqErr.response.status === 403) {
        setError({ message: 'You are not authorized to edit this transaction.' });
      } else if (reqErr.response && reqErr.response.status === 400) {
        setError({ message: reqErr.response.data?.message || 'Validation error.' });
      } else {
        setError({ message: reqErr.message || 'Failed to update transaction.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/vendor/transactions/${id}`);
  };

  if (loading) return <LoadingSpinner fullScreen label="Loading transaction" />;
  if (error) return <ErrorMessage fullScreen message={error.message} retry={handleCancel} />;

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Edit Transaction" subtitle={transaction?.transaction_reference} />
      <form className="transaction-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="type">Transaction Type</label>
        <select id="type" value={form.type} onChange={handleChange('type')} disabled={saving}>
          <option value="">Select type</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="WITHDRAWAL">Withdrawal</option>
          <option value="TRANSFER">Transfer</option>
          <option value="AIRTIME">Airtime</option>
          <option value="DATA">Data</option>
          <option value="BILL_PAYMENT">Bill Payment</option>
          <option value="OTHER">Other</option>
        </select>
        <label htmlFor="amount">Amount</label>
        <div className="amount-input">
          <span>GH₵</span>
          <input id="amount" type="text" value={form.amount} onChange={handleChange('amount')} disabled={saving} />
        </div>
        <label htmlFor="customer_reference">Customer Reference (optional)</label>
        <input id="customer_reference" type="text" maxLength={100} value={form.customer_reference} onChange={handleChange('customer_reference')} disabled={saving} />
        {error && <ErrorMessage message={error.message} />}
        <div className="transaction-form-actions mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}
