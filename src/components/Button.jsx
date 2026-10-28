export default function Button({ children, variant = 'primary', size = 'medium', type = 'button', disabled = false, className = '', ...props }) {
  return <button className={`button button--${variant} button--${size}${className ? ` ${className}` : ''}`} type={type} disabled={disabled} {...props}>{children}</button>;
}
