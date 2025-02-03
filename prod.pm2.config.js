module.exports = {
    apps : [{
        script    : "dist/main.js",
        name: "node-floway",
        log_date_format : "YYYY-MM-DD HH:mm Z",
        env: {
            "NODE_ENV": "production",
        },
        args: ""
    }]
}
