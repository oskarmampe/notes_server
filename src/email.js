const url = process.env.CLIENT_URI;
const fromEmail = process.env.FROM_EMAIL;

module.exports.welcomeEmail = function(email, user) {
    const text = `
    Sign up by confirming your email by following the link below:
    ${url}/signup/${user.id}
    `
    return {
        to: `${email}`,
        from: {
            address: fromEmail,
            name: 'test',
        },
        subject: 'Test - Complete your sign up',
        text,
    };
}