const reqController = require('../app/controllers/user')
const authController = require('../app/controllers/auth')
const adminController=require('../app/controllers/admin')
const auth=require('../app/middlewares/auth')

const adminAuth=require('../app/middlewares/adminAuth')
const updateAuth=require('../app/middlewares/update')

const logout=require('../app/middlewares/logout')
const login=require('../app/middlewares/login')

const register=require('../app/middlewares/register')
function initRoutes(app) {


    app.get('/login',login,authController().login);
    app.post('/login', authController().postlogin);

    app.get('/register',register,authController().register);
    app.post('/register', authController().postregister);

    app.get('/',auth,reqController().home);
    app.get('/logout',logout,authController().logout)
    app.get('/auth/:token',authController().activateAccount);
    app.get('/adminhome',adminAuth,adminController().adminhome);
    

    app.get('/update',updateAuth,reqController().update)
    app.post('/update',updateAuth,reqController().updateuser)

    app.get('/update/:id',adminAuth,adminController().updateAdmin)

    app.get('/delete/:id',adminAuth,adminController().deleteuser)

    app.post('/updateUserByAdmin',adminAuth,adminController().postupdateAdmin);

    app.get('/add',adminAuth,adminController().addUser);
    app.post('/add',adminAuth,adminController().postaddUser);
   
    app.get('/forget',authController().forget);
    app.post('/forget',authController().postforget)
    
     app.get('/forgetPassword/:token',authController().forgetPassword);

     app.post('/forgetPassword',authController().postforgetPassword);
}

module.exports = initRoutes