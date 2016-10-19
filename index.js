'fuck strict'
const http = require('http')
const fs = require('fs')
const request = require('es6-request')
const async = require('async')


let instaname = ""
let maxId = ""
let call_url = ""
let loc = 'location here'
let dir = '' 

const commandLineArgs = require('command-line-args')
 
const definitions = [
  { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
  { name: 'name', type: String, multiple: true, defaultOption: true },
  { name: 'dir', alias: 'd', type: String }
]
const options = commandLineArgs(definitions)

const call = (url, cb) => {
    request.get(url)
        .then(([data, res]) => {
            if (data.status = 'ok') {
                let obj = JSON.parse(data)
                if (Object.keys(obj.items).length > 0) {
                    let re = /(\w+).(jpg)/g
                    let revid = /(\w+).(mp4)/g
                    for (i in obj.items) {
                        maxId = obj.items[i].id
                        if (obj.items[i].videos != null) {
                            let vidstr = obj.items[i].videos.standard_resolution.url
                            let vid = vidstr.match(revid)
                            let dvurl = 'https://scontent-ams3-1.cdninstagram.com//' + vid
                            request.get(dvurl).pipe(fs.createWriteStream(dir + vid)).perform()
                                .then(() => {
                                if(options.verbose){
                                    console.log('downloaded video: ' + vid)
                                }
                            })
                                .catch(e => console.error('error while downloading video', e))

                        } else if (obj.items[i].type = "image") {
                            let imgstr = obj.items[i].images.thumbnail.url
                            let img = imgstr.match(re)
                            let diurl = 'https://scontent-ams3-1.cdninstagram.com//' + img
                            request.get(diurl).pipe(fs.createWriteStream(dir + img)).perform()
                                .then(() => {
                                if(options.verbose){
                                console.log('downloaded image: ' + img)
                                }
                            })
                                .catch(e => console.error('error while downloading image', e))
                        }
                    }
                    call_url = 'https://www.instagram.com/' + instaname + '/media/?max_id=' + maxId
                    call(call_url, cb)
                }
                else{
                    cb()
                }
            }
        })
        .catch(e => console.log('error getting media json', e))
}

const DO = (name, cb) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }
    let url = 'https://www.instagram.com/' + name + '/media/'
    call(url, cb)
}

let onFail = (err) => {
    console.log('err: '+err);
}
let onSuccess = (name, next) => {
    dir = loc + name + '/'
    instaname = name
    console.log('do: '+name+' on dir: '+ dir)
    DO(name, function() {
       next();  
    })   
}

if (options.dir != undefined){
    loc = options.dir
}
async.eachSeries(options.name, onSuccess, onFail);