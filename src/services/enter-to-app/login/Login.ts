import { Request, Response } from 'express'
import { ExtractDoc } from 'ts-mongoose'
import bcrypt from 'bcrypt'
import { errorFeedBack } from '../../../FeedBack'
import User, { UserSchema } from '../../../mongo-models/User'
import TokenCreator, { Tokens } from '../../../token-creator/tokenCreator'
import { ErrorResponse } from '../../../router'

class Login {
  public async login(req: Request, res: Response): Promise<Response<Tokens | ErrorResponse>> {
    try {
      const email: string = req.body.email
      const password: string = req.body.password
      if (!email.length || !password.length) throw new Error(errorFeedBack.requiredFields)
      const isContain: ExtractDoc<typeof UserSchema> | null = await User.findOne({ email })
      if (!isContain) throw new Error(errorFeedBack.enterToApp.validPassword)
      // случай когда был ли введен repassword
      if (isContain.repassword?.length) {
        const isValidRePassword: boolean = bcrypt.compareSync(password, isContain.repassword)
        const hash: string = bcrypt.hashSync(password, 10)
        if (!isValidRePassword) throw new Error(errorFeedBack.enterToApp.validPassword)
        await User.findOneAndUpdate({ email }, { password: hash, repassword: '' })
      } else {
        const isValidPassword: boolean = bcrypt.compareSync(password, isContain.password)
        if (!isValidPassword) throw new Error(errorFeedBack.enterToApp.validPassword)
        await User.findOneAndUpdate({ email }, { repassword: '' })
      }
      // запись токенов и случай когда выпадет ошибка 1 раз
      let tokens: Tokens | null = await TokenCreator.updateTokens(isContain._id)
      if (!tokens) {
        tokens = await TokenCreator.updateTokens(isContain._id)
        if (!tokens) throw new Error(errorFeedBack.tokens.invalid)
      }
      return res.status(200).json(tokens)
    } catch(e) {
      return res.status(404).json({ message: e.message })
    }
  }
}
const login = new Login()
export default login
