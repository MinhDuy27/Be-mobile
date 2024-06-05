  import {
    BadGatewayException,
    BadRequestException,
    Injectable,
  } from '@nestjs/common';
  import { InjectModel } from '@nestjs/mongoose';
  import { transactions } from './schema/transaction.schema';
  import * as mongoose from 'mongoose';
  import { Query } from 'express-serve-static-core';
  import { wallets } from '../wallets/schema/wallets-schema';
  import { budget } from '../budget/schema/budget.schema';
  import { createTransactionDTO } from './dto/createTransactionDTO';
  import { PassThrough } from 'stream';
  import { parse, isWithinInterval } from 'date-fns';
  import {getHistoriesDTO} from './dto/gethistoriesDTO'
  import {modifyTransactionDTO} from './dto/modifyTransactionDTO'
  import {deleteTransactionDTO} from './dto/deleteTransactionDTO'

  @Injectable()
  export class TransactionService {
    constructor(
      @InjectModel(transactions.name)
      private transactionsModel: mongoose.Model<transactions>,
      @InjectModel(wallets.name)
      private walletsModel: mongoose.Model<wallets>,
      @InjectModel(budget.name)
      private budgetModels: mongoose.Model<budget>,
    ) {}

    async create(transactions: createTransactionDTO) {
      const wallet_id = transactions.wallet_id;

      const wallets = await this.walletsModel.findOne({ _id: wallet_id });
      if (!wallets) throw new BadRequestException('invalid wallet_id');
      const category = transactions.category;

      const budget = await this.budgetModels.findOne({ wallet_id, category });
      const now: Date = new Date();
      const date: string = now
        .toLocaleString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '/');
      const [month, day, year] = date.split('/');
      const formattedDate = `${day}/${month}/${year}`;
      
      const object: transactions = {
        wallet_id: transactions.wallet_id,
        category: transactions.category,
        amount: transactions.amount,
        is_pay: transactions.is_pay,
        created_at: formattedDate,
        note_info: transactions.note_info
      };

      if (transactions.is_pay) {
        const temp = Number(wallets.amount) - Number(transactions.amount);
        if (temp < 0  )
          throw new BadRequestException(
            'not enough money in wallets to make transaction',
          );

        if (budget) {
          // update in budget
          const t1 = budget.amount;
          const t2 = transactions.amount;
          // const targetDate: Date = new Date(formattedDate);
          const targetDate: Date = parse(formattedDate, 'dd/MM/yyyy', new Date());
          const startDate: Date = parse(
            budget.start_date,
            'dd/MM/yyyy',
            new Date(),
          );
          const endDate: Date = parse(String(budget.end_date), 'dd/MM/yyyy', new Date());
          if (isWithinInterval(targetDate, { start: startDate, end: endDate })) {
              budget.amount = Number(t1) - Number(t2);
              await budget.save();
          }
        }

        //update in wallet
        wallets.amount = temp;
        await wallets.save();
      }
      // case ispay == false <=> get money
      else{
        const temp = Number(wallets.amount) + Number(transactions.amount);
        wallets.amount = temp;
        await wallets.save();
      }
      const res = await this.transactionsModel.create(object);
      return res;
    }
    async histories (query : Query){
        return await this.transactionsModel.find(query)

    }

    async Allhistories (query : Query){
      const {user_ID,start_date,end_date} = query
      const all_wallets =  await this.walletsModel.find({user_ID: user_ID})
      const promises = all_wallets.map(async (wallets) =>{
          const object = await this.transactionsModel.find({wallet_id:wallets._id})
          return object
          
      })
      const results = await Promise.all(promises);
      const concatenatedValues = [].concat(...results);
      if (start_date == null && end_date == null)
        {
          return concatenatedValues
        }
      // const fin = concatenatedValues.map(value => value)
      const startDate: Date = parse(
        String(start_date),
        'dd/MM/yyyy',
        new Date(),
      );
      const endDate: Date = parse(
        String(end_date),
        'dd/MM/yyyy',
        new Date(),
      );
      const filteredValues = concatenatedValues.filter((element) =>  isWithinInterval(parse(element.created_at, 'dd/MM/yyyy', new Date()), { start: startDate, end: endDate }) === true);
      return filteredValues
    }
    async delete(transaction:deleteTransactionDTO){
      const {_id} = transaction
      const object = await this.transactionsModel.findOne({_id})
      if(!object)
        throw new BadRequestException("invalid transaction_id")
      const wallet = await this.walletsModel.findOne({_id:object.wallet_id})
      const budget = await this.budgetModels.findOne({wallet_id:object.wallet_id,category: object.category,$expr: {
        $gt: [
          {
            $dateFromString: {
              dateString: '$end_date',
              format: '%d/%m/%Y'
            }
          },
          {
            $dateFromString: {
              dateString: object.created_at,
              format: '%d/%m/%Y'
            }
          }
        ]
      }}) 
      if(object.is_pay)
        {
          if(budget)
            {
              budget.amount = Number(object.amount) + Number(budget.amount)
              await budget.save()

            }
          wallet.amount = Number(object.amount) + Number(wallet.amount)
        }
      else
      {
        if(budget)
          {
            budget.amount = Number(budget.amount) - Number(object.amount) 
            await budget.save()
          }
        const temp = Number(wallet.amount) - Number(object.amount) 
        if(temp < 0 )
          throw new BadRequestException("amount of money in wallet < 0 after delete")
        wallet.amount = temp
      }
      await wallet.save()
      return await this.transactionsModel.findByIdAndDelete(_id)
    }

    async modify(transaction:modifyTransactionDTO){
      const{_id,...remain} = transaction
      const{category,amount,is_pay} = remain
      const object = await this.transactionsModel.findOne({_id})
      const wallet = await this.walletsModel.findOne({_id : object.wallet_id})
      if(!object)
          throw new BadRequestException("invalid transaction_id")
      if(category)
        {
          if (amount!= null && is_pay != null){
            let newamount = 0
            let temp_amount = 0 
            let temp_money = 0
            if(!object.is_pay){
              let temp_money = Number(wallet.amount) - Number(object.amount) - Number(amount)
              if (temp_money<0)
                throw new BadGatewayException("amount of money in wallet < 0 after modification")
            }
            else{
              let temp_money =  Number(wallet.amount) + Number(object.amount) + Number(amount)
            }
            wallet.amount = temp_money
            await wallet.save()
            if(object.is_pay){
              temp_amount = -Number(object.amount)
              newamount = +Number(amount)
            }
            else{
              temp_amount = +Number(object.amount)
              newamount = -Number(amount)
            }
            const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded 
            const temp = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:category}) // updated budget
            if(temp1)
              {
                temp1.amount = Number(temp1.amount) - temp_amount
                await temp1.save()
              }
            if(temp)   
              {
                temp.amount = Number(temp1.amount) + newamount
                await temp.save()
              } 
          }
          else if(amount != null && is_pay == null){
            let newamount = 0
            let temp_amount = 0 
            let temp_money = 0
            if(object.is_pay){
               temp_money = Number(wallet.amount) - (Number(amount)- Number(object.amount))
              if (temp_money<0)
                throw new BadGatewayException("amount of money in wallet < 0 after modification")
            }
            else{
               temp_money =  Number(wallet.amount) + ( Number(amount) - Number(object.amount))
              if (temp_money<0)
                throw new BadGatewayException("amount of money in wallet < 0 after modification")
            }
            wallet.amount = temp_money
            await wallet.save()
            if(object.is_pay){
              temp_amount = -Number(object.amount)
              newamount = -Number(amount)
            }
            else{
              temp_amount = +Number(object.amount)
              newamount = +Number(amount)
            }
            const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded 
            const temp = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:category}) // updated budget
            if(temp1)
              {
                temp1.amount = Number(temp1.amount) - temp_amount
                await temp1.save()
              }
              if(temp)    
                {
                  temp.amount = Number(temp1.amount) + newamount
                  await temp.save()
              }
           } 
           else if (amount == null && is_pay != null){
              const oip = object.is_pay
              let amount = 0
              let temp_money = 0
              if(!object.is_pay){
                temp_money = Number(wallet.amount) - 2*Number(object.amount)
                if (temp_money<0)
                  throw new BadGatewayException("amount of money in wallet < 0 after modification")
              }
              else{
                temp_money =  Number(wallet.amount) +2*Number(object.amount)
              }
              wallet.amount = temp_money
              await wallet.save()
              if(oip){
                amount = +Number(object.amount)
              }
              else{
                  amount = -Number(object.amount)
              }
              const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded one
              if(temp1){
                temp1.amount = Number(temp1.amount) + amount
                await temp1.save()
              }
              const temp = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:category}) // updated budget
              if(temp){
                temp.amount = Number(temp.amount) + amount
                await temp.save()
              }
            }
           else{
              const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded one
              const temp = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:category}) // updated budget
              let amount = object.amount
              if (!object.is_pay){
                amount = -amount
              }
              if(temp){
                temp.amount = Number(temp.amount) + Number(amount)
                await temp.save()
              }
              if(temp1){
                temp1.amount = Number(temp1.amount) - Number(amount)
                await temp1.save()
              }
            }
          }
      else{
        if (amount != null && is_pay != null){
          const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded one
          let res = Number(amount) 
         
              if (is_pay){
                if(temp1)
                  {
                    temp1.amount = Number(temp1.amount) + Number(object.amount) + Number(amount)
                    await temp1.save()
                  }
                wallet.amount = Number(wallet.amount) + Number(object.amount) + Number(amount)
              }
              else{
                if(temp1)
                  {
                    temp1.amount = Number(temp1.amount) - Number(object.amount) - Number(amount)
                    await temp1.save()
                  }
                let temp = Number(wallet.amount) - Number(object.amount) - Number(amount)
                if(temp < 0)
                  throw new BadGatewayException("amount of money in wallet < 0 after modification")
                wallet.amount = temp
                await wallet.save()
              }
              
            
        }
        else if(amount != null && is_pay == null){
          const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded one
          let change = Number(object.amount) -  Number(amount) 
            if (object.is_pay){
              if(temp1){
                 temp1.amount = Number(temp1.amount) - change
                 await temp1.save()
              }
              let temp = Number(wallet.amount) - change
              if(temp < 0)
                throw new BadGatewayException("amount of money in wallet < 0 after modification")
              wallet.amount = temp
              await wallet.save()
            }
            else{
              if(temp1){
                temp1.amount = Number(temp1.amount) + change
                await temp1.save()
             }
              let temp = Number(wallet.amount) + change
              if(temp < 0)
                throw new BadGatewayException("amount of money in wallet < 0 after modification")
              wallet.amount = temp
              await wallet.save()
            }
                 
         } 
         else if (amount == null && is_pay != null){
          const temp1 = await this.budgetModels.findOne({wallet_id:object.wallet_id,category:object.category}) // olded one
          if(!object.is_pay)
            {
              let temp = Number(wallet.amount) - 2*Number(object.amount)
              if(temp < 0)
                throw new BadGatewayException("amount of money in wallet < 0 after modification")
              wallet.amount = temp
              await wallet.save()
            }
          if(temp1){
            if (object.is_pay){
              temp1.amount = Number(temp1.amount) + 2*Number(object.amount)
              wallet.amount = Number(wallet.amount) + 2*Number(object.amount)
              await wallet.save()
            }
            else{
              temp1.amount = Number(temp1.amount) - 2*Number(object.amount)
            }
            await temp1.save()
        }
      }
    }
      return await this.transactionsModel.findByIdAndUpdate(_id,remain)
  }
}

      
