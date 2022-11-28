const express = require('express')
const cors = require('cors')
const { MongoClient,ServerApiVersion, ObjectId} = require('mongodb');
require('dotenv').config()  
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())




// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ojtfupc.mongodb.net/?authSource=admin`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ojtfupc.mongodb.net/?authSource=admin`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// const uri="mongodb://localhost:27017";
// const client = new MongoClient(uri)



function verifyJWT(req,res,next){
    const autheader = req.headers.authorization
    if(!autheader){
       return res.status(401).send({message:"unAuthorized user"})
    }
    const token = autheader.split(' ')[1]
    jwt.verify(token,process.env.TOKEN_SECRET,function(err,decoded){
        if(err){
            return res.status(403).send({message:"Forbidden User"})
        }
        req.decoded = decoded;
        next()
    })
}

const run=async()=>{
    try{
        const orderCollection = client.db("Genius-Car").collection("orders")
        const serviceCollection = client.db("Genius-Car").collection("services")
        const teamCollection = client.db('Genius-Car').collection("team")
        const productsCollection = client.db("Genius-Car").collection("products")


        app.post("/jwt",(req,res)=>{
            const user = req.body 
            console.log(user)
            const token = jwt.sign( user ,process.env.TOKEN_SECRET, {expiresIn:"24h"})
            res.send({token})
        })

        app.get("/team",async(req,res)=>{
            const cursor = teamCollection.find({})
            const team =await cursor.toArray()
            res.send(team)
        })

        app.get("/products",async(req,res)=>{
            const cursor = productsCollection.find({})
            const products = await cursor.toArray()
            res.send(products)
        })

        app.get('/services',async(req,res)=>{
             const order = parseInt(req.query.order)
            // const cursor = serviceCollection.find(query).sort({price:order})
            // const query={price:{$lt:200}}
            // const query={price : {$gt:150}}
            // const query={price : {$gte:150}}
            // const query={price : {$lte:150}}
            // const query={price:{$eq:150}}
            // const query={price:{$ne:200}}
            // const query={price:{$in:[80,200,320]}}
            // const query={price:{$nin:[80,200,320]}}
            // const query = {$and:[{title:"Engine Oil Change"},{price:{$lt:200}}]}
            // const query = {$or:[{title:"Full car Repair"},{title:"Engine Oil Change"}]}
            // const query={price:{$not:{$gt:200}}}
            const search = req.query.search
            let query = {}
            if(search){
                query={
                    $text: 
                    {
                        $search : search
                    }
                }
            }
            let cursor
            if(order){
                cursor = serviceCollection.find(query).sort({price:order})
            }
            else{
                cursor = serviceCollection.find(query)
            }
            const result =await cursor.toArray()
            res.send(result)
        })

        app.get("/services/:id",async(req,res)=>{
            const query = {_id:ObjectId(req.params.id)}
            const service =await serviceCollection.findOne(query)
            res.send(service)
        })

        app.get("/orders",verifyJWT,async(req,res)=>{
            const decoded = req.decoded
            if(decoded.email!==req.query.email){
                return res.status(403).send({message:"Forbidden User"})
            }
            let query = {}
            if(req.query.email){
                query = {email:req.query.email}
            }
            const cursor = orderCollection.find(query)
            const orders =await cursor.toArray()
            res.send(orders)
        })

        app.get("/orders/:id",verifyJWT,async(req,res)=>{
            const id = req.params.id
            const query={_id:ObjectId(id)}
            const orders = await orderCollection.findOne(query)
            res.send(orders)
        })

        app.post("/orders",verifyJWT,async (req,res)=>{
            console.log(req.body)
            const result = await orderCollection.insertOne(req.body)
            res.send(result)
        })

        app.delete("/orders/:id",verifyJWT,async(req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)}
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })

        app.patch("/orders/:id",verifyJWT,async(req,res)=>{
            const id = req.params.id 
            const query = {_id:ObjectId(id)}
            orderDoc={
                $set:{
                    status:req.body.status
                }
            }
            const result = await orderCollection.updateOne(query,orderDoc)
            res.send(result)
        })
    }
    catch{(error)=>console.log(error.message)}
}
run()

app.get("/",(req,res)=>{
    res.send({name:"mitaly"})
})

app.listen(port,()=>{
    console.log(`Genius car is running on ${port}`)
})