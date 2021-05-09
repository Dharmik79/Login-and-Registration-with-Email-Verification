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
const {
    geoSearch
} = require('../models/user')

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
        async createBlog(req, res) {
            const category = await categorySchema.find();

            if (category) {
                res.render('createBlog', {
                    categories: category
                })
            }
            res.redirect('/')

        },
        async postcreateBlog(req, res) {

            console.log(req.body)

            const {
                title,
                body,
                category,
                active
            } = req.body
            try {
                const user_id = req.user.id
                const updated_by = req.user.id

                let blog = new blogSchema({
                    title: title,
                    is_active: active,
                    body: body,
                    user_id: user_id,
                    updated_by: updated_by,
                    category_id: category

                })
                await blog.save().then((result) => {
                    console.log("Blog Added Successfully")
                    return res.redirect('/myBlog')
                }).catch((err) => {
                    console.log(err)
                    return res.redirect('/createBlog')
                })

                return res.redirect('/')

            } catch (err) {
                console.log(err)
                return res.redirect('/createBlog')
            }

        },
        async myBlog(req, res) {
            try {
                await blogSchema.find({
                    user_id: req.user.id
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category: "true",
                        categorie: categories
                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }
        },
        async updateBlog(req, res) {
            const id = req.params.id

            await blogSchema.findById(id, async (err, docs) => {
                if (err) {
                    console.log(err)
                    return res.redirect('/updateBlog')
                }
                const categories = await categorySchema.find();
                console.log(categories)
                res.render('updateBlog', {
                    blog: docs,
                    categories: categories

                })
            })


        },
        async deleteBlog(req, res) {
            const id = req.params.id

            await blogSchema.findByIdAndDelete(id, (err, docs) => {
                if (err) {
                    console.log(err)
                    return res.redirect('/myBlog')
                }
                console.log("BLog deleted Successfully")
                return res.redirect('/myBlog')

            })
            return res.redirect('/myBlog')
        },
        async postUpdateBlog(req, res) {
            const {
                id,
                title,
                category,
                body,
                active
            } = req.body
            console.log(category)
            await blogSchema.findByIdAndUpdate(id, {
                title: title,
                is_active: active,
                body: body,
                category_id: category,
                updated_by: req.user.id

            }, (err, docs) => {
                if (err) {
                    console.log(err)
                    res.redirect('/myBlog')
                }
                console.log("Blog Updated")
                res.redirect('/myBlog')

            })

            return res.redirect('/myBlog')
        },
        async blogsPage(req, res) {
            const blogs = await blogSchema.byActive(true)
            const categories = await categorySchema.find()
            res.render('blogsPage', {
                blogs: blogs,
                categories: categories
            })
        },
        async search(req, res) {
            var {
                dsearch
            } = req.body
            const categories = await categorySchema.find()
            const blogs = await blogSchema.find({
                '$and': [{
                        '$or': [{
                            title: {
                                '$regex': dsearch
                            }
                        }, {
                            body: {
                                '$regex': dsearch
                            }
                        }]
                    },
                    {
                        is_active: true
                    }
                ]
            })

            res.render('blogsPage', {
                blogs: blogs,
                categories: categories
            })
        },
        async filter(req, res) {
            const {
                category
            } = req.body
            const categories = await categorySchema.find()
            const cat = await blogSchema.find({
                category_id: category,
                is_active: true
            })

            res.render('blogsPage', {
                blogs: cat,
                categories: categories,

            })
        },
        async filterMyBlog(req, res) {

            try {
                const {
                    filter
                } = req.body

                console.log(filter)
                await blogSchema.find({
                    user_id: req.user.id,
                    is_active: filter
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category: filter,
                        categorie: categories

                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }

        },
        async filterByCategoryMyBlog(req, res) {

            try {
                const {
                    category
                } = req.body

                await blogSchema.find({
                    user_id: req.user.id,
                    category_id: category
                }, async (err, docs) => {
                    if (err) {
                        console.log(err)
                        return res.redirect('/')
                    }
                    const categories = await categorySchema.find();
                    var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                    const active = await blogSchema.byUser(req.user.id, true)
                    const inactive = await blogSchema.byUser(req.user.id, false)
                    res.render('myBlog', {
                        blogs: docs,
                        category_list: categories,
                        active: active.length,
                        inactive: inactive.length,
                        categories: loop,
                        filter_category:"true",
                        categorie: categories

                    })

                })
            } catch (err) {
                console.log(err)
                return res.redirect('/')
            }


        },
        async searchMyBlog(req, res) {
            var {
                dsearch
            } = req.body
            const categories = await categorySchema.find()
            const blogs = await blogSchema.find({
                '$and': [{
                        '$or': [{
                            title: {
                                '$regex': dsearch
                            }
                        }, {
                            body: {
                                '$regex': dsearch
                            }
                        }]
                    },
                    {
                        is_active: true
                    },{
                        user_id:req.user.id
                    }
                ]
            })
            const active = await blogSchema.byUser(req.user.id, true)
            const inactive = await blogSchema.byUser(req.user.id, false)
          var loop = [];

                    for (let index = 0; index < categories.length; index++) {

                        const category = categories[index]
                        const cat = await blogSchema.byUserCategory(category._id, req.user.id, true)
                        if (cat != '') {
                            loop.push({
                                key: category.name,
                                value: cat.length
                            })
                        }
                    }
                
            res.render('myBlog', {
                blogs: blogs,
                category_list: categories,
                active: active.length,
                inactive: inactive.length,
                categories: loop,
                filter_category:"true",
                categorie: categories
            })

        }

    }
}

module.exports = reqController