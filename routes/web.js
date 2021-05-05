const reqController = require('../app/controllers/user')
const auth=require('../app/middlewares/auth')

const adminAuth=require('../app/middlewares/adminAuth')
const updateAuth=require('../app/middlewares/update')

function initRoutes(app) {


    app.get('/login', reqController().login);
    app.post('/login', reqController().postlogin);

    app.get('/register', reqController().register);
    app.post('/register', reqController().postregister);

    app.get('/',auth,reqController().home);
    app.get('/logout',auth,reqController().logout)
    app.get('/auth/:token',reqController().activateAccount);
    app.get('/adminhome',adminAuth,reqController().adminhome);
    

    app.get('/update',updateAuth,reqController().update)
    app.post('/update',updateAuth,reqController().updateuser)
    app.get('/update/:id',adminAuth,reqController().updateAdmin)

    app.get('/delete/:id',adminAuth,reqController().deleteuser)

    app.post('/updateUserByAdmin',adminAuth,reqController().postupdateAdmin);

    app.get('/add',adminAuth,reqController().addUser);
    app.post('/add',adminAuth,reqController().postaddUser);
   
    app.get('/forget',reqController().forget);
    app.post('/forget',reqController().postforget)
    
     app.get('/forgetPassword/:token',reqController().forgetPassword);

     app.post('/forgetPassword',reqController().postforgetPassword);
}

module.exports = initRoutes