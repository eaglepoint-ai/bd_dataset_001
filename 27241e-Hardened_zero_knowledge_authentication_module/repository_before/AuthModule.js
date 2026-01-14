// Legacy Insecure Auth
const USERS = [];

function registerUser(username, password) {
    const user = {
        id: USERS.length + 1,
        username: username,
        password: password // Plain text!
    };
    USERS.push(user);
    console.log("User registered:", username);
}

function authenticate(username, password) {
    for (let i = 0; i < USERS.length; i++) {
        if (USERS[i].username === username && USERS[i].password === password) {
            return true;
        }
    }
    return false;
}

registerUser("admin", "1234");
console.log("Login Success:", authenticate("admin", "1234"));