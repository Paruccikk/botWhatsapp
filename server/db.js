const fs = require("fs");

const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync("usuarios.json", "utf8"));
    } catch (error) {
        return {};
    }
};

const saveUsers = (users) => {
    fs.writeFileSync("usuarios.json", JSON.stringify(users, null, 2), "utf8");
};

module.exports = { loadUsers, saveUsers };
