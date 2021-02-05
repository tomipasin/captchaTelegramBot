require('dotenv').config()

const express = require('express')
const Telegraf = require('telegraf')
const captcha = require('./captcha.js')

// only to run in heroku
const app = express()

app.set('port', (process.env.PORT || 3002))

app.get('/', (request, response) => response.send('App is running'))

app.listen(app.get('port'), () =>
  console.log('App is running, server is listening on port:', app.get('port')))


// início do bot
const bot = new Telegraf(process.env.TOKEN)

//criação do App responsável pelas funcionalidades do bot - um objeto com 
//vários ítens.
const App = {
  //aqui o captcha que o usuário vai digitar. Ele é inicializado como
  //um array vazio.
  usersInCaptcha: [],

  //A função init chama os binds e também o launch do bot.
  init() {
    this.bindEvents()
    bot.launch()
  },

  //binde events faz os bindings(!) necessários para o funcionamento.
  bindEvents() {
    bot.command('startAutoMsgs', this.startAutoMessages)
    bot.command('stopAutoMsgs', this.stopAutoMessages)
    bot.on('new_chat_members', this.Events.onMemberEnter.bind(this))
    bot.on('message', this.Events.onNewMessage.bind(this))
  },

  //aqui o disparo de mensagens automáticas inicia com intervalos de 1, 3 e 5 dias.
  startAutoMessages(ctx) {

    ctx.reply('Nunca deixe de sonhar 🇵🇹')

    this.mmp = setInterval(() => {
      ctx.reply(`Vcs conhecem o Método Morar em Portugal? 🇵🇹\n\nLá tem todas informações que você precisa para imigrar com segurança!\n\nClique neste link para saber mais: http://bit.ly/388mjha`)
    }, 86400000) // 1 day

    this.m1 = setInterval(() => {
      ctx.reply(`Você tem que acordar todos os dias e dizer para si mesmo(a):\n\n"Eu posso, eu consigo, eu vou morar em Portugal! 🇵🇹\n\nContinue acreditando!`)
    }, 259200000) // 3 day

    this.m2 = setInterval(() => {
      ctx.reply(`O poder está dentro de você, na sua mente, pois se acreditar que consegue não haverá obstáculo capaz de impedir o seu sucesso! Força! 🇵🇹`)
    }, 432000000) // 5 day
  },

  
  stopAutoMessages(ctx) {
    console.log(ctx)
    ctx.reply('Portugal é um país maravilhoso, vcs não acham?! 🇵🇹')

    clearInterval(this.mmp)
    clearInterval(this.m1)
    clearInterval(this.m2)
  },

  getRandomCaptcha() {
    const randomNumber = Math.floor(Math.random() * captcha.length) + 0
    console.log(randomNumber)
    return captcha[randomNumber]


  },

  kickUserInCaptcha({ ctx, id, message }) {
    const user = this.usersInCaptcha.find(user => user.id === id)

    if (user) {
      this.removeUserFromCaptchaList(user.id)
      ctx.kickChatMember(id)
      ctx.reply(message)
    }
  },

  deleteMessages(ctx, messagesId) {
    messagesId.forEach(id => {
      if (id) ctx.deleteMessage(id).catch(console.log)
    })
  },

  removeUserFromCaptchaList(id) {
    this.usersInCaptcha = this.usersInCaptcha.filter(user => user.id !== id)
  },

  Events: {
    async onNewMessage(ctx) {
      console.log('#### on new message')

      const { message } = ctx
      const { from, text } = message

      console.log('#### users in captcha', this.usersInCaptcha)


      // check if user is in captcha list
      const user = this.usersInCaptcha.find(user => user.id === from.id) || null

      if (user) {
        if (text == user.captcha.code) {
          this.removeUserFromCaptchaList(user.id)
          await ctx.reply(`👍 Ok, ${user.userString} não é um robô.`)
          await ctx.reply(`${user.userString}, não esqueça de ler as regras na mensagem fixada no topo do grupo.`)
          this.deleteMessages(ctx, user.messagesToDelete)
        } else {
          user.attempt -= 1

          if (user.attempt <= 0) {
            this.kickUserInCaptcha({
              ctx,
              id: user.id,
              message: `🚨 ${user.userString} não digitou o código corretamente e foi removido(a).`
            })

            if (message && message.message_id) {
              user.messagesToDelete.push(message.message_id)
            }

            this.deleteMessages(ctx, user.messagesToDelete)

          } else {
            const msg_invalid = await ctx.reply(`${user.userString}, código inválido, você tem mais ${user.attempt} tentativas. Maiúsculas e minúsculas fazem diferença.`)
            user.messagesToDelete.push(msg_invalid.message_id)
            user.messagesToDelete.push(message.message_id)
          }

          // update user attempt in captcha list
          this.usersInCaptcha = this.usersInCaptcha.map(usr => {
            return usr.id === user.id
              ? { ...usr, attempt: user.attempt, messagesToDelete: user.messagesToDelete }
              : usr
          })
        }
      }
    },
    
    async onMemberEnter(ctx) {
      console.log(ctx)
      const { message } = ctx
      const { new_chat_participant } = message
      const { id, first_name, last_name, username } = new_chat_participant

      if (username === 'porteirotugabot') return

      let userString = `${first_name}`
      if (last_name) userString += ` ${last_name}`
      if (username) userString += ` (@${username})`

      const captcha = this.getRandomCaptcha() || captcha[0]
      const msg_welcome = await ctx.replyWithPhoto({ source: `./images/${captcha.image}` }, { caption: `Olá ${userString}!\n\nSeja bem-vindo(a) ao grupo Morar em Portugal 🇵🇹!\n\nATENÇÃO: Para garantir que você não é um robô, envie uma mensagem com as letras e números que aparecem na imagem acima dentro de 3 minutos.\nLetras maiúsculas e minúsculas fazem diferença. Você tem três chances. \nSe a mensagem não for enviada você será removido(a) do grupo automaticamente.` })
      const messagesToDelete = [msg_welcome.message_id, captcha.image]

      console.log('######### captcha', captcha)

      // add user to captcha list
      this.usersInCaptcha.push({
        id,
        userString,
        captcha,
        attempt: 3,
        messagesToDelete,
      })

      setTimeout(() => {
        this.deleteMessages(ctx, messagesToDelete)

        this.kickUserInCaptcha({
          ctx,
          id,
          message: `🚨 ${userString} não digitou o código e foi removido(a).`
        })
      }, 180000)

    }
  }
}


App.init()

