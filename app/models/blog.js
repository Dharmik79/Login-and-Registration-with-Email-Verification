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
  category_id:[{
      type:mongoose.Schema.Types.ObjectId,
      ref:"category"
  }],
  user_id:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"model"
  },
 updated_by:{
    type:mongoose.Schema.Types.ObjectId,
      ref:"model"
 }
},
{
    timestamps:true
}
)
Blog.statics.byActive=function(name)
{
    return this.find({is_active:name})
}

Blog.statics.byUser=function(id,is_active)
{
    return this.find({user_id:id,is_active:is_active})
}
Blog.statics.byCategory=function(id,is_active)
{
    return this.find({category_id:id,is_active:is_active})
}
const blog=mongoose.model('blog',Blog)
module.exports=blog