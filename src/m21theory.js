/**
 * m21theory -- supplemental routines for music theory teaching and
 * assessment using the javascript reimplementation of music21 (music21j). 
 *
 * See http://web.mit.edu/music21/ for more details.
 * 
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 *
 * This version is released for use in 2013-14 in non-minimized form under LGPL or 
 * proprietary licenses (your choice; the former is Free; the latter costs money,
 * but lets you use minimizers, etc. to optimize web loading).  The permanent license 
 * is still under discussion; please contact cuthbert@mit.edu for more information.
 * 
 * All interfaces are alpha and may change radically from day to day and release to release.
 * Do not use this in production code yet.
 * 
 * 2014-05-01 -- v.0.2.alpha (release)
 * 2013-10-05 -- v.0.1.alpha 
 * 
 */


if (typeof (m21theory) === "undefined") {
	m21theory = {};
}
m21theory.debug = false;

require.config({
    paths: {
        'jquery': 'ext/jquery/jquery-2.1.1.min',
        'jquery-ui': 'ext/jqueryPlugins/jqueryUI/jquery-ui.min',
        'vexflow': 'ext/vexflow/vexflow-min',
        'es6-shim': 'ext/es6-shim',
        'vexflowMods': 'ext/vexflowMods',
        'unpickler': 'ext/jsonpickle/unpickler',
    },
    shim: {
        'jquery-ui': {
            deps: [ 'jquery' ],
            exports: 'jQuery.ui'
        },
        'vexflow': {
            deps: [ 'jquery' ],
            exports: 'Vex'
        },
    }
});

if ( typeof define === "function" && define.amd) {
    define( "m21theory", ['music21', 
                          'm21theory/userData', 'm21theory/random', 'm21theory/misc',
                          'm21theory/bank', 'm21theory/section', 'm21theory/tests'], 
    		function (music21) { 
        
        music21.MIDI.loadSoundfont('acoustic_grand_piano', function() { 
                m21theory.misc.playMotto(music21.MIDI); 
            });

    	// this may get loaded twice, but I think the cache handles it...
	});
}