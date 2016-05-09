var mongoose = require('mongoose');

var MasterySchema = new mongoose.Schema({
  highestGrade: String,
  championPoints: Number,
  playerId: Number,
  championPointsUntilNextLevel: Number,
  chestGranted: Boolean,
  championLevel: Number,
  championId: Number,
  championPointsSinceLastLevel: Number,
  lastPlayTime: Date
});

mongoose.model('Mastery', MasterySchema);