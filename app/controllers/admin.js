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

function adminController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'Admin' ? '/adminhome' : '/'
    }
    return {
     
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
       
        async adminhome(req, res) {

            const users = await modelSchema.find({
                role: "User"
            })
           
            res.render('adminhome', {
                users: users
            })

        }
    }
}

module.exports = adminController