define("m21theory/tests/noteIdentification", 
        ["m21theory/section", "m21theory/random", 'm21theory/question'], 
        function (section, random, question) {
	
    var NoteQuestion = function (handler, index) {
        question.Question.call(this, handler, index);   
    };
    NoteQuestion.prototype = new question.Question();
    NoteQuestion.prototype.constructor = NoteQuestion;
    
    NoteQuestion.prototype.render = function () {
        var s = this.section.getStream();
        var minDiatonicNoteNum = s.clef.firstLine - 1 - (2 * this.section.allowableLedgerLines);
        var maxDiatonicNoteNum = s.clef.firstLine + 9 + (2 * this.section.allowableLedgerLines);
        var answerList = [];
        for (var j = 0; j < this.section.numNotes; j++) {
            var n;
            do {
                var chosenDiatonicNoteNum = random.randint(minDiatonicNoteNum,
                                                                maxDiatonicNoteNum);
                var p = new music21.pitch.Pitch("C");
                p.diatonicNoteNum = chosenDiatonicNoteNum;
                var newAlter = random.choice(this.section.allowableAccidentals);
                p.accidental = new music21.pitch.Accidental( newAlter );

                n = new music21.note.Note("C");
                n.duration.quarterLength = 0.5; // Not Working: type = 'eighth';
                n.pitch = p;
            } while ( (n.pitch.name == 'B#') ||
                      (n.pitch.name == 'E#') ||
                      (n.pitch.name == 'F-') ||
                      (n.pitch.name == 'C-') );
            s.append(n);
            answerList.push(n.pitch.name.replace(/\-/, 'b'));
        }
        // last answer is always an earlier note with same accidental
        var foundPitch = undefined;
        for (var j = 0; j < this.section.numNotes; j++) {
            var p = s.get(j).pitch;
            if (p.accidental.alter != 0) {
                foundPitch = p;
                break;
            }
        }
        if (foundPitch == undefined) {
            // default
            var chosenDiatonicNoteNum = random.randint(minDiatonicNoteNum,
                                                            maxDiatonicNoteNum);
            foundPitch = new music21.pitch.Pitch("C");
            foundPitch.diatonicNoteNum = chosenDiatonicNoteNum;
            var newAlter = random.choice(this.section.allowableAccidentals);
            foundPitch.accidental = new music21.pitch.Accidental( newAlter );
        }
        var n = new music21.note.Note("C");
        n.duration.quarterLength = 0.5; // Not Working: type = 'eighth';
        n.pitch.diatonicNoteNum = foundPitch.diatonicNoteNum;
        n.pitch.accidental = new music21.pitch.Accidental(foundPitch.accidental.alter);
        s.append(n);
        answerList.push(n.pitch.name.replace(/\-/, 'b'));
        
        // done adding pitches
        s.makeAccidentals();
        var streamAnswer = answerList.join(' ');
        s.renderOptions.events['click'] = undefined;
        var nc = s.createCanvas(400);
        var $questionDiv = $("<div style='width: 420px; float: left; padding-bottom: 20px'></div>");
        $questionDiv.append(nc);
                                
        if (this.isPractice) {
            $questionDiv.append( $("<div style='padding-left: 10px; position: relative; top: 0px'>" +
                    "Example: <b>" + 
                    streamAnswer + 
                    "</b></div>") );
        } else {
            this.$inputBox = $("<input type='text' size='24' class='unanswered'/>")
                             .change( this.checkTrigger );
            this.storedAnswer = streamAnswer;
            $questionDiv.append( $("<div style='padding-left: 30px; position: relative; top: 0px'/>")
                             .append(this.$inputBox) );
        }
        this.$questionDiv = $questionDiv;
        return $questionDiv;
    };

    
    var ThisTest = function () {
		section.Generic.call(this);
		this.assignmentId = 'noteIdentificationTest';
		this.totalQs = 6;
		this.practiceQs = 1;
		this.allowableLedgerLines = 0;
		this.allowableClefs = ['treble','bass'];
		this.allowableAccidentals = [0, 1, -1];
		this.title = "Note Identification";
		this.instructions = "<p>" +
			"Identify the notes in the following excerpts. Use <b>#</b> and <b>b</b> " +
			"for sharp and flat.  You may write in uppercase or lowercase.  Place a space " +
			"after each note for clarity (optional, but highly recommended)." +
			"</p>";
		this.lastPs = 0.0;
		this.numNotes = 7;
        this.useAug2014System = true;
        this.questionClass = NoteQuestion;
        
		this.checkAnswer = function (storedAnswer, answerGiven, question) {
			return (storedAnswer.toLowerCase().replace(/\s*/g, "") == 
			         answerGiven.toLowerCase().replace(/\s*/g, "") );
		};		
		this.getStream = function () {
	        var s = new music21.stream.Stream();
	        s.renderOptions.scaleFactor.x = 1.0;
	        s.renderOptions.scaleFactor.y = 1.0;
	        s.autoBeam = true;
	        s.clef = new music21.clef.Clef( random.choice(this.allowableClefs) );
	        s.timeSignature = '4/4';
	        return s;
		};
	};

	ThisTest.prototype = new section.Generic();
	ThisTest.prototype.constructor = ThisTest;
	
		return ThisTest;
});