const mongoose=require('mongoose')

const Blog=mongoose.Schema({
  is_active:
  {
      type:Boolean,
      default:true
  },
  title:
  {
      type:String,
      required:true
  },
  body:{

      type:String,
      required:true
  },
  category_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"category"
  },
  user_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"model"
  },
 
},
{
    timestamps:true
}
)

const blog=mongoose.model('blog',Blog)

module.exports=blog