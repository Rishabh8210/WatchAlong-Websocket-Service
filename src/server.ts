import express, { Request, Response } from 'express'
import { PORT } from './configs/server-config'

const app = express();
app.use(express.json());

app.get('/', (req:Request, res:Response) => {
    res.status(200).json({
        "message": "Hello User"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
})