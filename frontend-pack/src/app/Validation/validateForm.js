export default function validateForm(data) {
    const errors = {};
  
    if (!/^[A-Za-z]+$/.test(data.firstname)) {
      errors.firstname = "Firstname should contain only letters.";
    }
  
    if (!/^[A-Za-z]+$/.test(data.lastname)) {
      errors.lastname = "Lastname should contain only letters.";
    }
  
    if (!/^[A-Za-z0-9]{1,30}$/.test(data.username)) {
      errors.username = "Username must be alphanumeric and up to 30 characters.";
    }
  
    if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Invalid email format.";
    }
  
    if (data.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }
  
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  
    return errors;
  }
  