const mongoose=require('mongoose')

const Tag=mongoose.Schema({
  
  name:
  {
      type:String,
      required:true
  }
}
)

const tag=mongoose.model('tag',Tag)

module.exports=tag