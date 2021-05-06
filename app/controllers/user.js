require('dotenv').config()

const modelSchema = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const nodemailer = require("nodemailer");
const blogSchema = require('../models/blog')
const categorySchema = require('../models/category')

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
        createBlog(req, res) {
            res.render('createBlog', {
                user: req.user
            })
        },
        async postcreateBlog(req, res) {
            const {
                title,
                body,
                category,
                active
            } = req.body
            try {
                await categorySchema.findOne({
                    name: category
                }, async (err, docs) => {
                    if (err) {
                        console.log("No record Found")
                        return res.redirect('/')
                    }

                    if (!docs) {
                        console.log("No category for this schema So inseting new category")
                        let cat = new categorySchema({
                            name: category,
                            desc: body
                        })
                        await cat.save().then(async (result) => {
                            console.log("Category Added Successfully")
                            const user_id = req.user.id
                            const category_id = cat._id

                            let blog = new blogSchema({
                                title: title,
                                is_active: active,
                                body: body,
                                user_id: user_id,
                                category_id: category_id
                            })
                            await blog.save().then((result) => {
                                console.log("Blog Added Successfully")
                                return res.redirect('/')
                            }).catch((err) => {
                                console.log(err)
                                return res.redirect('/createBlog')
                            })

                            return res.redirect('/')
                        }).catch((err) => {
                            console.log("Error Ocured at blog inserton");
                            return res.redirect('/createBlog')
                        })
                        return res.redirect('/')
                    }

                    const user_id = req.user.id
                    const category_id = docs._id

                    let blog = new blogSchema({
                        title: title,
                        is_active: active,
                        body: body,
                        user_id: user_id,
                        category_id: category_id
                    })
                    await blog.save().then((result) => {
                        console.log("Blog Added Successfully")
                        return res.redirect('/')
                    }).catch((err) => {
                        console.log(err)
                        return res.redirect('createBlog')
                    })

                    return res.redirect('/')





                })

                res.render('home')
            } catch (err) {
                console.log(err)
                return res.redirect('/createBlog')
            }
        },
        async myBlog(req,res)
        {
            try{
            await blogSchema.find({user_id:req.user.id},async(err,docs)=>{
                if(err)
                {
                    console.log(err)
                    return res.redirect('/')
                }
            
         res.render('myBlog',{blogs:docs})     

            })
        }
        catch(err)
        {
            console.log(err)
            return res.redirect('/')
        }
        },
        async updateBlog(req,res)
        {
              const id=req.params.id
              await blogSchema.findById(id,(err,docs)=>{
                  if(err)
                  {
                      console.log(err)
                      return res.redirect('/updateBlog')
                  }
                  res.render('updateBlog',{blog:docs})
              })
             return res.redirect('/updateBlog')
              
        },
        async deleteBlog(req,res)
        {
            const id=req.params.id

            await blogSchema.findByIdAndDelete(id,(err,docs)=>{
                if(err)
                {
                    console.log(err)
                  return  res.redirect('/myBlog')
                }
                console.log("BLog deleted Successfully")
              return   res.redirect('/myBlog')

            })
           return  res.redirect('/myBlog')
        },
       async  postUpdateBlog(req,res)
        {
            const {id,title,body,active}=req.body
            await blogSchema.findByIdAndUpdate(id,{
                   title: title,
                        is_active: active,
                        body: body,
                       
            },(err,docs)=>{
                if(err)
                {
                    console.log(err)
                    res.redirect('/myBlog')
                }
                console.log("Blog Updated")
                res.redirect('/myBlog')

            })

            return res.redirect('/myBlog')
        }
    }
}

module.exports = reqController