require('dotenv').config()

const modelSchema = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const nodemailer = require("nodemailer");
const {
    model
} = require('mongoose')
const {
    render
} = require('ejs')

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USERNAME,
        pass: process.env.PASSWORD,
    }
});

function reqController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'Admin' ? '/adminhome' : '/'
    }
    return {
        forget(req, res) {
            res.render('forget')
        },
        async postforget(req, res) {
            const email = req.body.email
            console.log(email)
            await modelSchema.findOne({
                email: email
            }, (err, docs) => {
                if (err) {
                    console.log("error")
                    res.redirect('/forget')
                }
                const {
                    email
                } = docs

                const token = jwt.sign({
                    email,
                }, 'secret', {
                    expiresIn: '20m'
                });
                var mail = {
                    from: "noreply <no reply@gmail.com>", // sender address
                    to: email, // list of receivers
                    subject: "PASSWORD RESET", // Subject line
                    html: `<h2>Please click on the given link to RESET THE PASSWORD</h2>
                        <p>http://localhost:3000/forgetPassword/${token}</p>

                    `, // html body

                }
                transporter.sendMail(mail, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log("Password Reset Link Sent Successfully")
                        res.rdirect('/login')
                    }
                })
            })
            res.render('login')
        },
        forgetPassword(req, res) {
            const token = req.params.token
            if (token) {
                jwt.verify(token, 'secret', (err, decodeToken) => {
                    if (err) {
                        console.log(err)
                        res.redirect('/forget')
                    }
                    const {
                        email
                    } = decodeToken
                    res.render('forgetPassword', {
                        email: email
                    })
                })
            }
            res.redirect('/forget')
        },

        async postforgetPassword(req, res) {
            const {
                email,
                pass1,
                pass2
            } = req.body
            if (pass1 == pass2) {
                await modelSchema.findOne({
                    email: email
                }, async(err, docs) => {
                    if (err) {
                        res.redirect('/forget')
                    }
                    const hashPassword = await bcrypt.hash(pass1, 10);
                    console.log(docs.password)

                    docs.password = hashPassword
                    console.log(hashPassword)
                    docs.save();
                    console.log(docs.password)
                    var mail = {
                        from: "roreply@google.com",
                        to: email,
                        subject: "Password Changed Successfully",
                        html: `<h1>New Password ${pass1}</h1>`
                    }
                    transporter.sendMail(mail, (err, result) => {
                        if (err) {
                            console.log(err)
                            res.redirect('/forget')
                        }
                        console.log("Password Changed Successfully")
                        res.redirect('/login')
                    })



                })
            }

            res.redirect('/login')
        },
        async addUser(req, res) {
            res.render('addnewUser')
        },
        async postaddUser(req, res) {
            try {
                const {
                    name,
                    email,
                    role,
                    pass1,
                    pass2
                } = req.body;

                if (pass1 != pass2) {
                    console.log("Password doesnot Match")
                    res.render('add')
                }


                // Hashed Password

                const hashPassword = await bcrypt.hash(pass1, 10)

                const token = jwt.sign({
                    name,
                    email,
                    role,
                    hashPassword
                }, 'secret', {
                    expiresIn: '20m'
                });
                var mail = {
                    from: "noreply <no reply@gmail.com>", // sender address
                    to: email, // list of receivers
                    subject: "Email Verification", // Subject line

                    html: `<h2>Please click on the given link to activate the account</h2>
                        <p>http://localhost:3000/auth/${token}</p>

                        <h2>Username :${email}</h2>
                        <h2>Password :${pass1}</h2>
                    `, // html body

                }
                transporter.sendMail(mail, (err, result) => {
                    if (err) {
                        console.log(err)


                    } else {
                        console.log("Verification Email Sent Successfully")
                        res.rdirect('/adminhome')
                    }
                })


                res.redirect('/adminhome')
            } catch (err) {
                console.log(err)
                res.render('register')
            }
        },

        async deleteuser(req, res) {
            const id = req.params.id
            await modelSchema.findByIdAndDelete(id, (err, docs) => {
                if (err) {
                    console.log(err)
                    res.redirect('/adminhome')
                }
                const email = docs.email

                var mail = {
                    from: "noreply <no reply@gmail.com>", // sender address
                    to: email, // list of receivers
                    subject: "AccountDeletion by Admin",

                }
                transporter.sendMail(mail, (err, result) => {
                    if (err) {
                        console.log(err)

                    } else {
                        console.log("Email Sent Successfully for Account deletion")
                        res.rdirect('/adminhome')
                    }
                })
            })
            res.redirect('/adminhome')
        },
        async postupdateAdmin(req, res) {
            try {
                console.log(req.body)
                const {
                    name,
                    password,
                    password2,
                    email,

                } = req.body

                if (password == password2) {
                    if (name && !password) {
                        await modelSchema.findOne({
                            email: email
                        }, (err, docs) => {
                            if (err) {
                                console.log(err)
                            }
                            docs.name = name
                            docs.save();
                            res.redirect('/adminhome')
                        })
                    } else if (name && password) {
                        console.log(req.user)

                        const hashPassword = await bcrypt.hash(password, 10);
                        modelSchema.findOne({
                            email: email
                        }, (err, docs) => {
                            if (err) {
                                console.log(err)
                            }
                            docs.name = name
                            docs.password = hashPassword
                            docs.save();

                            var mail = {
                                from: "noreply <no reply@gmail.com>", // sender address
                                to: email, // list of receivers
                                subject: "password Changed",
                                // Subject line
                                html: `<h2>Username : ${email}</h2>
                                    <h2>Password: ${password}</h2>
                                `
                            }
                            transporter.sendMail(mail, (err, result) => {
                                if (err) {
                                    console.log(err)

                                } else {
                                    console.log("Email Sent Successfully for password updation")
                                    res.rdirect('/adminhome')
                                }
                            })
                        })
                        res.redirect('/adminhome')
                    }
                } else {
                    console.log("Password is not correct")
                    res.redirect('/update')

                }
            } catch (e) {
                console.log(e)
            }
        },
        async updateAdmin(req, res) {
            const id = req.params.id
            const User = await modelSchema.findById(id);
            console.log(User)
            res.render('updateUserByAdmin', {
                User: User
            })
        },
        update(req, res) {
            const {
                role,
                name,
                email
            } = req.user
            User = {
                role: role,
                name: name,
                email: email,
            }
            res.render('update', {
                User: User
            })
        },
        async updateuser(req, res) {
            try {
                console.log(req.body)
                const {
                    name,
                    password,
                    password2
                } = req.body

                if (password == password2) {
                    if (name && !password) {
                        await modelSchema.findById(req.user.id, (err, docs) => {
                            if (err) {
                                console.log(err)
                            }
                            docs.name = name
                            docs.save();
                            res.redirect(_getRedirectUrl(req))
                        })
                    } else if (name && password) {
                        console.log(req.user)

                        const hashPassword = await bcrypt.hash(password, 10);
                        modelSchema.findById(req.user.id, (err, docs) => {
                            if (err) {
                                console.log(err)
                            }
                            docs.name = name
                            docs.password = hashPassword
                            docs.save();

                            var mail = {
                                from: "noreply <no reply@gmail.com>", // sender address
                                to: req.user.email, // list of receivers
                                subject: "password Changed",
                                // Subject line
                                html: `<h2>Username : ${req.user.email}</h2>
                                    <h2>Password: ${password}</h2>
                                `
                            }
                            transporter.sendMail(mail, (err, result) => {
                                if (err) {
                                    console.log(err)

                                } else {
                                    console.log("Email Sent Successfully for password updation")
                                    res.redirect(_getRedirectUrl(req))
                                }
                            })
                        })
                        res.redirect(_getRedirectUrl(req))
                    }
                } else {
                    console.log("Password is not correct")
                    res.redirect('/update')

                }
            } catch (e) {
                console.log(e)
            }


        },
        login(req, res) {
            res.render('login')
        },
        logout(req, res) {
            req.logout()
            return res.redirect('/login')
        },

        postlogin(req, res, next) {
            const {
                email,
                pass1
            } = req.body;
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    console.log(info.message)
                    return next(err);
                }
                if (!user) {
                    console.log(info.message)
                    res.redirect('/login')
                }
                req.logIn(user, (err) => {
                    if (err) {
                        console.log(info.message)
                        return next(err);
                    }

                    res.redirect(_getRedirectUrl(req))
                });
            })(req, res, next);

        },
        register(req, res) {
            res.render('register')
        },
        home(req, res) {
            res.render('home')
        },
        async postregister(req, res) {
            try {
                const {
                    name,
                    email,
                    role,
                    pass1,
                    pass2
                } = req.body;

                if (pass1 != pass2) {
                    console.log("Password doesnot Match")
                    res.redirect('/register')
                }


                // Hashed Password

                const hashPassword = await bcrypt.hash(pass1, 10)

                const token = jwt.sign({
                    name,
                    email,
                    role,
                    hashPassword
                }, 'secret', {
                    expiresIn: '20m'
                });
                var mail = {
                    from: "noreply <no reply@gmail.com>", // sender address
                    to: email, // list of receivers
                    subject: "Email Verification", // Subject line

                    html: `<h2>Please click on the given link to activate the account</h2>
                        <p>http://localhost:3000/auth/${token}</p>
                    `, // html body

                }
                transporter.sendMail(mail, (err, result) => {
                    if (err) {
                        console.log(err)


                    } else {
                        console.log("Verification Email Sent Successfully")
                        res.rdirect('/login')
                    }
                })



            } catch (err) {
                console.log(err)
                res.render('register')
            }
        },

        activateAccount(req, res) {
            try {
                const {
                    token
                } = req.params;
                console.log(token)
                if (token) {
                    jwt.verify(token, 'secret', (err, decodeToken) => {
                        if (err) {
                            return res.status(400).json({
                                error: "Incorrect or Expired link."
                            })

                        }
                        const {
                            name,
                            email,
                            role,
                            hashPassword
                        } = decodeToken;
                        console.log(role)
                        modelSchema.exists({
                            email: email
                        }, (err, result) => {
                            if (result) {
                                console.log("User Already Exists")
                                return res.redirect('login')
                            }
                            let user = new modelSchema({
                                name: name,
                                email: email,
                                role: role,
                                password: hashPassword
                            })
                            user.save().then((result) => {
                                console.log("user Saved Successfully")
                                return res.render('login')
                            }).catch((err) => {
                                console.log(err);
                                return res.render('register')
                            })

                        })
                    })
                }
            } catch (e) {
                console.log(e)
            }


        },
        async adminhome(req, res) {

            const users = await modelSchema.find({
                role: "User"
            })
            console.log(users)
            res.render('adminhome', {
                users: users
            })

        }
    }
}

module.exports = reqController