/**
 * m21theory -- supplemental routines for music theory teaching  
 * m21theory/serverSettings -- user settings in one place
 * 
 * Copyright (c) 2014, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 */

define(['jquery', 'm21theory/feedback', 'music21/common', 'm21theory/userData'], 
        function($, feedback, common, userData) {
    var s = {}; 
    s.host = '';
    s.changePassword = s.host + '/server/cgi-bin/change_pw.cgi';
    s.checkLogin = s.host + '/server/cgi-bin/check_login.cgi';
    s.testResponseURL = "http://ciconia.mit.edu/m21j/testSectionResponse2.cgi";

    serverSettings = s;
    
    s.makeAjax = function (objToMakeJSON, options) {
        if (objToMakeJSON === undefined) {
            objToMakeJSON = {};
        }
        if (objToMakeJSON.studentData === undefined) {
            objToMakeJSON.studentData = userData.studentData;
        }
        var jsonObj = JSON.stringify(objToMakeJSON);
        var params = {
                type: "POST",
                url: serverSettings.testResponseURL,
                data: { json: jsonObj },
                dataType: 'json',
                success: function (jsonData) { 
                    feedback.alert(jsonData, 'ok');
                },
                error: function (data, errorThrown) { 
                    alert("Got a problem! -- print this page as a PDF and email it to cuthbert@mit.edu: " + data); 
                },
        };
        common.merge(params, options);
        $.ajax(params);
    };
    
    
    // end of define
    if (typeof(m21theory) != "undefined") {
        m21theory.serverSettings = serverSettings;
    }       
    return serverSettings;
});