var mongoose = require('mongoose');

var SummonerSchema = new mongoose.Schema({
  summonerName: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  summonerId: Number,
  level: Number,
  profileIcon: Number,
  updated: {
    type: Date,
    required: true
  },
  masteries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mastery'
  }],
  revisionDate: Number
});

mongoose.model('Summoner', SummonerSchema);