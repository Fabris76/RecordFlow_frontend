import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTransactionById, getTransactionHistory } from "../../services/transactionService";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import PageHeader from "../../components/PageHeader";
import { formatMoney } from "../../utils/format";
import Button from "../../components/Button";

// Simple table component for edit history
const HistoryTable = ({ history }) => (
  <table className="history-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
    <thead>
      <tr>
        <th>Field</th>
        <th>Previous</th>
        <th>New</th>
        <th>Changed By</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      {history.map((h) => (
        <tr key={h.id} style={{ borderBottom: "1px solid #ddd" }}>
          <td>{h.field_name}</td>
          <td>{h.old_value ?? "-"}</td>
          <td>{h.new_value ?? "-"}</td>
          <td>{h.changed_by_name || h.changed_by}</td>
          <td>{new Date(h.changed_at).toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const OwnerTransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Fetch transaction
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const data = await getTransactionById(id);
        setTransaction(data);
      } catch (e) {
        if (e.response && (e.response.status === 403 || e.response.status === 404)) {
          setError({ message: "Transaction not found or you do not have permission to view it." });
        } else {
          setError({ message: "Failed to load transaction details." });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id]);

  // Fetch edit history after transaction is loaded
  useEffect(() => {
    if (!transaction) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await getTransactionHistory(id);
        setHistory(data);
      } catch (e) {
        setHistoryError(e.message || "Failed to load edit history.");
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [transaction, id]);

  const handleBack = () => {
    navigate("/owner/transactions");
  };

  if (loading) return <LoadingSpinner fullScreen label="Loading transaction" />;
  if (error) return <ErrorMessage fullScreen message={error.message} retry={handleBack} />;

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="Transaction Detail" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><strong>ID:</strong> {transaction.id}</div>
        <div><strong>Type:</strong> {transaction.type}</div>
        <div><strong>Amount:</strong> {formatMoney(transaction.amount)}</div>
        <div><strong>Status:</strong> {transaction.status}</div>
        <div><strong>Customer Ref:</strong> {transaction.customer_reference || "-"}</div>
        <div><strong>Vendor:</strong> {transaction.vendor_name || "-"}</div>
        <div><strong>Date:</strong> {new Date(transaction.transaction_date).toLocaleString()}</div>
        <div><strong>Created At:</strong> {new Date(transaction.created_at).toLocaleString()}</div>
      </div>
      <div className="mt-6 flex items-center">
        <Button onClick={handleBack}>Back to List</Button>
      </div>
      {/* Edit History Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold">Edit History</h3>
        {loadingHistory && <LoadingSpinner label="Loading history" />}
        {historyError && <ErrorMessage message={historyError} />}
        {!loadingHistory && !historyError && history.length === 0 && <div>No edit history available.</div>}
        {!loadingHistory && history.length > 0 && <HistoryTable history={history} />}
      </div>
    </div>
  );
};

export default OwnerTransactionDetail;
