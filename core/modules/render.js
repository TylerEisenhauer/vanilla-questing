// RENDER EVERYTHING
function map(data, settings, reference) {

   // UPDATE CURRENT PROP & LOCALSTORAGE
   data.current = reference;
   localStorage.setItem(data.storage, String(reference));

   // CONVERT STRING TO INT FOR EASIER USAGE LATER
   var current = parseInt(data.current);

   // UPDATE THE RANGE SCROLLERS POSITION
   $('#range').val(current);

   // GRADUALLY TURN OPACITY OFF FROM MAP & SIDEPANEL
   $('#map').css('opacity', 0);
   $('#sidepanel-inner').css('opacity', 0);

   // CALIBRATE PROGRESS & SET THE PROPERTY
   data.stats.progress = ((current / (data.stats.blocks - 1)) * 100);

   // ADD ONE FOR VISUAL PURPOSES
   var current_fixed = current + 1;

   // CHANGE PROGRESS BAR TEXT & SIZE
   $('#progress-inner').html('#' + current_fixed + ' &#160;&ndash;&#160; ' + (data.stats.progress).toFixed(2) + '%');
   $('#progress-focus').css('width', data.stats.progress + '%');

   // TARGET SPECIFIC DATASET
   var target = data.build[current];

   // SEPARATE THE LEVEL & XP FROM THE EXPERIENCE PROPERTY
   var level = parseInt(String(target.experience.toFixed(2)).split(".")[0]);
   var xp = parseInt(String(target.experience.toFixed(2)).split(".")[1]);

   // CHANGE LEVEL BAR TEXT & SIZE
   $('#level-inner').html('Level ' + level + ' + ' + xp + '%');
   $('#level-focus').css('width', xp + '%');

   // WAIT 300MS, THEN START UPDATING MAP
   sleep(300).then(() => {
   
      // EMPTY THE MAP & TOOLTIP SELECTORS & TURN OFF THE TOOLTIP TO AVOID FLICKERING
      $('#map, #tooltip').html('');
      $('#tooltip').css('display', 'none');

      // SET THE CORRECT ZONE BACKGROUND TO THE MAP
      $('#map').css('background', 'url("interface/img/maps/' + target.zone + '.png")');

      // LOOP THROUGH EACH WAYPOINT IN BLOCK
      $.each(target.waypoints, (id, waypoint) => {

         // SET THE DEFAULT NUMBER POSITION TO LEFT
         var align_coords = settings.align.left;
         
         // CHECK WHETHER ANOTHER ALIGNMENT WAS REQUESTED -- OVERWRITE
         if (waypoint.align != undefined) { align_coords = settings.align[waypoint.align]; }

         // GENERATE A WAYPOINT SELECTOR
         var point = `
            <div class="waypoint" style="left: ` + waypoint.coords.x + `%; top: ` + waypoint.coords.y + `%;">
               <img src="interface/img/waypoints/space.png" class="` + waypoint.type + `" wp="` + id + `"><span class="waypoint-num" style="left: ` + align_coords.x + `;top: ` + align_coords.y + `"><img src="interface/img/numbers/` + (id + 1) + `.png"></span>
            </div>
         `;

         // APPEND IT TO THE MAP
         $('#map').append(point);
      });

      // LINE CONTAINER
      var lines = '';

      // GENERATE LINES BETWEEN FIRST & SECOND TO LAST WAYPOINTS
      for(var x = 0; x < target.waypoints.length - 1; x++) {
         lines += '<line x1="' + target.waypoints[x].coords.x + '%" y1="' + target.waypoints[x].coords.y + '%" x2="' + target.waypoints[x + 1].coords.x + '%" y2="' + target.waypoints[x + 1].coords.y + '%"/>';
      }

      // APPEND IN AN SVG CANVAS & LINES ONTOP OF THE MAP
      $('#map').append('<svg>' + lines + '</svg>');

      // GENERATE ADDITIONAL ASSIST SELECTORS
      var legend = '<span id="show-legend">Map Legend</span>';
      var hs = '<span id="hearthstone"><span id="hearthstone-inner">None</span></span>';
      var tooltip = '<div id="tooltip"></div>';

      // RENDER THEM IN
      $('#map').append(legend + hs + tooltip);

      // RENDER SIDEPANEL CONTENT
      sidepanel(data, settings);

      // RENDER HEARTHSTONE LOCATION
      hearthstone(data);

      // GRADUALLY TURN OPACITY ON AGAIN
      $('#map').css('opacity', 1);
      $('#sidepanel-inner').css('opacity', 1);
   });

   return data;
}

// GENERATE OVERLOOK FOR THE CURRENT BLOCK
function sidepanel(data, settings) {

   var ids = data.ids;

   // TARGET BLOCK WAYPOINTS
   var target = data.build[data.current].waypoints;

   // MAIN SELECTOR
   var sidepanel = $('#sidepanel-inner');
   var container = '';

   // LOOP THROUGH EACH WAYPOINT
   $.each(target, (index, waypoint) => {
   
      // MAKE INDEX MORE READER FRIENDLY
      var count = index + 1;

      // GENERATE A SELECTOR & PUSH IT TO THE CONTAINER
      container += `
         <div class="section">
            <div class="title">
               <div class="split">
                  <div id="left">` + count + `. ` + waypoint.header + `</div>
                  <div id="right"></div>
               </div>
            </div>
      `;

      // LOOP THROUGH ENDS, STARTS & OBJECTIVES CONTENT THAT ARE DEFINED
      if (waypoint.ends != undefined) { waypoint.ends.forEach(details => { container += row('ends', details, settings, ids); }); }
      if (waypoint.starts != undefined) { waypoint.starts.forEach(details => { container += row('starts', details, settings, ids); }); }
      if (waypoint.objectives != undefined) { waypoint.objectives.forEach(details => { container += row('objectives', details, settings, ids); }); }
      if (waypoint.special != undefined) { waypoint.special.forEach(details => { container += '<div class="special">' + details + '</div>'; }); }

      // ADD ON SUFFIX
      container += '</div>';
   });

   sidepanel.html(container);
}

// GENERATE SIDEPANEL ROW
function row(category, data, settings, ids) {

   // ROW CONTAINER
   var container = '';

   // CHECK THE GIVEN DATA TYPE
   var type = typeof(data);

   // IF ITS A STRING -- GENERATE & APPEND A SELECTOR
   if (type === 'string') {
      container += '<div class="' + category + '"><a href="https://classicdb.ch/?quest=' + ids[data.toLowerCase()] + '" target="_blank">' + shorten(data, settings) + '</a></div>';

   // IF ITS AN ARRAY -- GENERATE & APPEND A SELECTOR
   } else {
      container += `
         <div class="` + category + `">
            <div class="split">
               <div id="left"><a href="https://classicdb.ch/?quest=` + ids[data[0].toLowerCase()] + `" target="_blank">` + shorten(data[0], settings) + `</a></div>
               <div id="right">` + data[1] + `</div>
            </div>
         </div>
      `;
   }

   // RETURN THE CONTAINER
   return container;
}

// GET CURRENT QUESTS
function quests(data) {

   var quests = {};

   for (var x = 0; x < data.current; x++) {

      var waypoints = data.build[x].waypoints;

      waypoints.forEach(waypoint => {
      
         // STARTS
         if (waypoint.starts != undefined) {

            waypoint.starts.forEach(quest => {
               
               if (typeof(quest) != 'string') {
                  quests[quest[0]] = 0;
               } else {
                  quests[quest] = 0;
               }

            });
         }

         // ENDS
         if (waypoint.ends != undefined) {

            waypoint.ends.forEach(quest => {
               
               if (typeof(quest) != 'string') {
                  delete quests[quest[0]];
               } else {
                  delete quests[quest];
               }

            });
         }
      });
   }

   log(quests);
}

function hearthstone(data) {

   // LOCATION PLACEHOLDER
   var location = 'none';

   for (var x = data.current; x >= 0; x--) {

      // BREAK THE LOOP AFTER THE FIRST HIT
      if (location != 'none') { break; }

      // WAYPOINTS SHORTHAND
      var waypoints = data.build[x].waypoints;

      // LOOP THROUGH EACH WAYPOINT
      waypoints.forEach(waypoint => {
      
         // MAKE SURE SPECIAL ARRAY ISNT UNDEFINED
         if (waypoint.special != undefined) {

            // LOOP THROUGH MESSAGES
            waypoint.special.forEach(message => {

               // FORCE LOWERCASE
               message = message.toLowerCase();

               // SET AS THE LOCATION WHEN THE KEYWORD IS FOUND
               if (message == 'set hearthstone') { location = capitalize(data.build[x].zone); }
            });
         }
      });
   }

   // CAPITALIZE IF STV
   if (location == 'Stv') { location = 'STV'; }

   $('#hearthstone-inner').html(location);
}

// EXPORT MODULES
module.exports = {
   map: map
}