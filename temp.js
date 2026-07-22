const fs = require('fs');
let css = fs.readFileSync('frontend/src/index.css', 'utf8');
css = css.replace(/\/\* OVERRIDE FOR LOGIN PAGE[\s\S]*?$/g, '');

const newCSS = `
/* OVERRIDE FOR LOGIN PAGE (Two-Column Grok-like) */
.login-page {
  display: flex;
  min-height: 100vh;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.login-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border-right: 1px solid #333;
}
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  padding: 40px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
}
.login-logo {
  margin-bottom: 32px;
}
.login-logo h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.login-logo p {
  font-size: 15px;
  color: #71767b;
}
.login-card .form-input, .login-card .form-select {
  background: transparent;
  border: 1px solid #333639;
  border-radius: 4px;
  padding: 16px;
  font-size: 16px;
  color: #fff;
  transition: border-color 0.15s;
  width: 100%;
}
.login-card .form-input:focus, .login-card .form-select:focus {
  border-color: #fff;
  outline: none;
}
.login-card .btn-primary {
  background: #fff;
  color: #0f1419;
  font-weight: 700;
  border: none;
  font-size: 15px;
  border-radius: 9999px;
  padding: 14px 24px;
  cursor: pointer;
  width: 100%;
  margin-top: 10px;
}
.login-card .btn-primary:hover {
  background: #d7dbdc;
}
@media (max-width: 768px) {
  .login-left { display: none; }
}
`;

fs.writeFileSync('frontend/src/index.css', css.trim() + '\n\n' + newCSS);
console.log('CSS updated');
