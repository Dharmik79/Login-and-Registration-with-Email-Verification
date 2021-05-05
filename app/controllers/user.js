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
        home(req, res) {
            
            res.render('home')
        },
        
    }
}

module.exports = reqController