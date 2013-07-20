var steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    dota2 = require("../../node-dota2/index"),
    bot = new steam.SteamClient(),
    Dota2 = new dota2.Dota2Client(bot, true),
    MongoClient = require("mongodb").MongoClient;

global.config = require("./config");

/* Steam logic */
var onSteamLogOn = function onSteamLogOn(){
        bot.setPersonaState(steam.EPersonaState.Busy); // to display your bot's status as "Online"
        bot.setPersonaName(config.steam_name); // to change its nickname
        util.log("Logged on.");

        Dota2.launch();
        Dota2.on("ready", function() {
            // Dota2.setItemPositions([[ITEM ID, POSITION]]);
            // Dota2.deleteItem(ITEM ID);
            // Dota2.joinChat("wobwobwob");
            // setTimeout(function(){ Dota2.sendMessage("wobwobwob", "wowoeagnaeigniaeg"); }, 5000);
            // setTimeout(function(){ Dota2.leaveChat("wobwobwob"); }, 10000);
            // Dota2.inviteToGuild(5287, 28956443);
            // Dota2.setGuildAccountRole(5287, 28956443, 2);
            // Dota2.cancelInviteToGuild(5287, 75028261);
            // Dota2.passportDataRequest(28956443);
            // Dota2.on("passportData", function (accountId, passportData) {
            //     console.log(passportData.leagueGuesses.stampedPlayers);
            // });
            // Dota2.profileRequest(28956443, true);
            // Dota2.on("profileData", function (accountId, profileData) {
            //     console.log(JSON.stringify(profileData, null, 2));
            // });
            setInterval(function handleJobQueue(){
            // setTimeout(function handleJobQueue(){
                util.log("Handling jobs");
                MongoClient.connect('mongodb://127.0.0.1:27017/webdota', function(err, db) {
                    if(err) throw err;

                    var jobCollection = db.collection('jobs'),
                        jobCursor = jobCollection.find();

                    jobCursor.each(function (err, doc){
                        if(err) throw err;

                        if (doc) Dota2.profileRequest(doc.account_id, true);
                    });


                    Dota2.on("profileData", function (accountId, profileData) {
                        var profileCollection = db.collection('profiles'),
                            jobCollection = db.collection('jobs');
                        if (profileData.status) {
                            util.log("Amg a status: "+ profileData.status);
                        }
                        profileCollection.update({"account_id": accountId}, {
                            "data": profileData,
                            "account_id": accountId,
                            "_last_updated": (Date.now() / 1000)
                        }, {upsert:true}, function(err){ console.log(err); });
                        jobCollection.remove({"account_id": accountId}, function(err){ console.log(err); });
                    });
                });
            }, 60000);
        });

        Dota2.on("chatMessage", function(channel, personaName, message) {
            // util.log([channel, personaName, message].join(", "));
        });

        Dota2.on("guildInvite", function(guildId, guildName, inviter) {
            // Dota2.setGuildAccountRole(guildId, 75028261, 3);
        });

        Dota2.on("unhandled", function(kMsg) {
            util.log("UNHANDLED MESSAGE " + kMsg);
        });
        // setTimeout(function(){ Dota2.exit(); }, 5000);
    },
    onSteamSentry = function onSteamSentry(sentry) {
        util.log("Received sentry.");
        require('fs').writeFileSync('sentry', sentry);
    },
    onSteamServers = function onSteamServers(servers) {
        util.log("Received servers.");
        fs.writeFile('servers', JSON.stringify(servers));
    };

bot.logOn(config.steam_user, config.steam_pass, config.steam_guard_code || fs.readFileSync('sentry'));
bot.on("loggedOn", onSteamLogOn)
    .on('sentry', onSteamSentry)
    .on('servers', onSteamServers);