import {User} from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import {Meeting} from "../models/meetingModel.js";
const loginUser=async(req,res)=>{
    const {username,password}=req.body;
    if(!username || !password){
        return res.status(400).json({message:"Username and password are required"});
    }

    try{
        const user=await User.findOne({username});
        if(!user){
            return res.status(400).json({message:"Invalid username or password"});
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if(!passwordMatches){
            return res.status(400).json({message:"Invalid username or password"});
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token=token;
        await user.save();
        return res.status(200).json({token});
    }catch(error){
        console.error("Error checking existing user:", error);
        return res.status(500).json({message:"Internal server error"});
    }

}



const registerUser=async(req,res)=>{
    const {name,username,password}=req.body;

    if(!name || !username || !password){
        return res.status(400).json({message:"Name, username and password are required"});
    }

    try{
        const existingUser=await User.findOne({username});
        if(existingUser){
            return res.status(400).json({message:"Username already exists"});
        }

    const hashedPassword=await bcrypt.hash(password,10);

    const newUser=new User({
        name,
        username,
        password:hashedPassword,
    })

    await newUser.save();
    res.status(201).json({message:"User registered successfully"});


    }catch(error){
        console.error("Error checking existing user:", error);
        return res.status(500).json({message:"Internal server error"});
    }
}


const getUserHistory=async (req,res)=>{
    const {token}=req.query;

    try{
        const user=await User.findOne({token})
        const meetings=await Meeting.find({user_id:user.user})
        res.json(meetings)
    }catch(e){
        res.json("Error fetching user history:", e);
        r
    }
}

const addToHistory=async (req,res)=>{
    const {token,meeting_Code}=re.query;
    try{
        const user=await User.findOne({token})
        const newMeeting=new Meeting({
            user_id:user.username,
            meeting_Code:meeting_Code
        })
        await newMeeting.save();
        res.json({message:"Meeting added to history"})
    }catch(e){
        res.json({message:"Error adding meeting to history",error:e
        })
    }
}

export {loginUser,registerUser,getUserHistory,addToHistory};