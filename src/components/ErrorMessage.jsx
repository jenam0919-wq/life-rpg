function ErrorMessage({ message = "Something went wrong." }) {
  return <p className="auth-error" role="alert">{message}</p>;
}

export default ErrorMessage;
