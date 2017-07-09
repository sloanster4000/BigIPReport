/*************************************************************************************************************************************************************************************

	BigIP-report Javascript

*************************************************************************************************************************************************************************************/

var asInitVals = new Array();

var pools;
var monitors;
var virtualservers;
var irules;
var datagrouplists;
var defaultPreferences;
var oTable;

/*************************************************************************************************************************************************************************************

	Waiting for all pre-requisite objects to load

*************************************************************************************************************************************************************************************/

$(window).load(function() {
	// Animate loader off screen
	
	$.when(
		// Get pools
		$.getJSON("./json/pools.json", function(result){
			pools = result;
		}),

		//Get the monitor data
		$.getJSON("./json/monitors.json", function(result){
			monitors = result;
		}),
		//Get the virtual servers data
		$.getJSON("./json/virtualservers.json", function(result){
			virtualservers = result;
		}),
		//Get the irules data
		$.getJSON("./json/irules.json", function(result){
			irules = result;
		}),
		//Get the datagroup list data
		$.getJSON("./json/datagrouplists.json", function(result){
			datagrouplists = result;
		}),
		$.getJSON("./json/defaultpreferences.json", function(result){
			defaultPreferences = result;
		})
	).then(function() {
		$(".se-pre-con").fadeOut("slow");

		/********************************************************************************************************************************************************************************************

			All pre-requisite things has loaded

		********************************************************************************************************************************************************************************************/


		/*************************************************************************************************************

			Load preferences

		**************************************************************************************************************/

		loadPreferences();
			
		/*************************************************************************************************************
		
			This attaches an on click event to all Poolinformation cells (the cell in the main data table 
			containing pool information that makes sure that the pool details lightbox is shown when 
			clicking on the	pool details cell without the cell content collapsing
			
		**************************************************************************************************************/
		
		
		$(".PoolInformation").click(function(e) {
			if($(e.target).attr("class") != "tooltip"){
				togglePool(e.target);
			}
		})
		
		
		
		/*************************************************************************************************************
		
			Initiate data tables, add a search all columns header and save the standard table header values
		
		**************************************************************************************************************/
		
		$("thead input.search_init").each( function (i) {
				asInitVals[i] = this.value;
		} );
		
		
		oTable = $('#allbigips').DataTable( {

			"iDisplayLength": 15,
			"oLanguage": {
				"sSearch": "Search all columns:"
			}
		} );
		
		
		/*************************************************************************************************************
		
			Attaches a function to the main data table column filters that 
			removes the text from the input windows when clicking on them
			and adds the possibility to filter per column
		
		**************************************************************************************************************/
		
		$("thead input").focus( function () {
			if ( this.className == "search_init" )
			{
				this.className = "search_entered";
				this.value = "";
			}
		} );
		
		//Prevents sorting the columns when clicking on the sorting headers
		$('.search_init').on('click', function(e){
		   e.stopPropagation();    
		});
		
		$('.search_entered').on('click', function(e){
		   e.stopPropagation();    
		});
		
		
		$("thead input").blur( function (i) {
			if ( this.value == "" ){
				this.className = "search_init";
				this.value = asInitVals[$("thead input").index(this)];
			}
		} );
		
		/*************************************************************************************************************
		
			This section handles the irule selection dropdown initiation and the syntax highlighting
		
		**************************************************************************************************************/	

		$("#allbigips_filter").append($("#iRuleSelectiondiv").html());
		$("#iRuleSelectiondiv").html("");
		
		//Initiate chosen (the searchable dropdown used for displaying irules
		$(".iRuleDropdown").chosen();
		
		/* Handles when someone chooses an element from the dropdown dropbox */
		//$('#iRuleDropdown').live('change', function () {
		$('#iRuleDropdown').change(function(){
			var irulediv = "#" + $(this).val();
			$(irulediv).show();
			$(irulediv).children().center();
		});
		
		/* Initiate the syntax highlighting for irules*/
		sh_highlightDocument('/js/', '.js');
		
		/*************************************************************************************************************
		
			This section inserts a share link and settings and displays them
		
		**************************************************************************************************************/	
		
		$("#allbigips_filter").append('<a href="javascript:void(0);" onMouseClick="" onMouseOver="javascript:showShareLink()" class="sharelink">Share search<p>CTRL + C to copy<br><input id="sharelink" value=""></p></a>');
		$("#allbigips_filter").append("<input type=\"checkbox\" id=\"autoExpandPools\">Expand all pool members <input type=\"checkbox\" id=\"adcLinks\"> Direct links to Big-IP objects");
		
		$("#autoExpandPools").prop("checked", localStorage.getItem("autoExpandPools") === "true");
		$("#adcLinks").prop("checked", localStorage.getItem("showAdcLinks") === "true");

		$("#autoExpandPools").on("click", function(){
				localStorage.setItem("autoExpandPools", this.checked);
				oTable.draw();
		});

		$("#adcLinks").on("click", function(){
				localStorage.setItem("showAdcLinks", this.checked);
				oTable.draw();
		});
		
		/*************************************************************************************************************
		
			This section adds the update check button div and initiates the update checks
		
		**************************************************************************************************************/	
		
		//Add the div containing the update available button
		$("#allbigips_filter").after($('<div id="updateavailablediv"></div>'));
		
		//Check if there's a new update every 30 minutes
		setInterval(function(){
			$.ajax(document.location.href, {
				type : 'HEAD',
				success : function (response, status, xhr) {

					var currentreport = Date.parse(document.lastModified);
					var latestreport = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
					var currenttime  = new Date();

					timesincelatestgeneration = Math.round((((currenttime - latestreport) % 86400000) % 3600000) / 60000)
					timesincerefresh = Math.round((((latestreport - currentreport) % 86400000) % 3600000) / 60000)

					if( timesincerefresh > 240){
						if(timesincelatestgeneration > 5){
							$("#updateavailablediv").html('<a href="javascript:document.location.reload()" class="criticalupdateavailable">Report update available</a>');
						}
					} else if ( timesincerefresh != 0){
						if(timesincelatestgeneration > 5){
							$("#updateavailablediv").html('<a href="javascript:document.location.reload()" class="updateavailable">Report update available</a>');
						}
					}

				}
				}); 
		},1800000 );
		
		/****************************************************************************************************************************** 
		
			Lightbox related functions
		
		******************************************************************************************************************************/
		
		
		/* Hide the lightbox if clicking outside the information box*/
		$('body').on('click', function(e){
			if(e.target.className == "lightbox"){
				$('.lightbox').hide();
			}
		});
		
		/* Center the lightbox */
		jQuery.fn.center = function () {
			this.css("position","absolute");
			//this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
			this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
			return this;
		}
		
		/****************************************************************************************************************************** 
		
			Add custom data tables functions
		
		******************************************************************************************************************************/

		
		//Expand pool matches  and hightlight them
		oTable.on( 'draw', function () {

			var body = $( oTable.table().body() );

			highlightAll(oTable);
			
			
			hidePools();

			if(localStorage.getItem("showAdcLinks") === "false"){
				$(".adcLinkSpan").hide();
			} else {
				$(".adcLinkSpan").show();
			}

			if(oTable.search() != ""){
				expandPoolMatches(body, oTable.search());
			}

			setPoolTableCellWidth();
					
		} );
		
		//Filter columns on key update
		oTable.columns().every( function () {
			
			var that = this;
			
			$( 'input', this.header() ).on( 'keyup change', function () {
				that
					.search( this.value )
					.draw();
					expandPoolMatches($( oTable.table().body()), this.value)
					highlightAll(oTable);
			} );		
			
		} );
		



		
		/*************************************************************************************************************
		
			If any search parameters has been sent, populate the search
		
		**************************************************************************************************************/	
				
		//Make sure that all pools are hidden 
		populateSearchParameters(oTable);
		oTable.draw();
	});
});


/********************************************************************************************************************************************************************************************

	Functions used by the main data table

********************************************************************************************************************************************************************************************/


/****************************************************************************************************************************** 
	Highlight all matches
******************************************************************************************************************************/

function highlightAll(oTable){
	
	var body = $( oTable.table().body() );
	
	body.unhighlight();
	body.highlight( oTable.search() );  
		
	oTable.columns().every( function () {
	
		var that = this;
		
		columnvalue = $('input', this.header()).val()
		
		if(asInitVals.indexOf(columnvalue) == -1){
			body.highlight(columnvalue);
		}	
	});
}

/****************************************************************************************************************************** 
	Gets the query strings and populate the table
******************************************************************************************************************************/

function populateSearchParameters(oTable){
	
	var vars = {};
	var hash;
	
	if(window.location.href.indexOf('?') >= 0){
		
		//Split the query string and create a dictionary with the parameters
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		
		for(var i = 0; i < hashes.length; i++){
			hash = hashes[i].split('=');
			vars[hash[0]] = hash[1];
		}
		
		//Populate the search and column filters
		for(var key in vars){
			
			value = vars[key];
			
			//If it's provided, populate and search with the global string
			if(key == "global_search"){
				if($('#allbigips_filter input[type="search"]')){
					$('#allbigips_filter input[type="search"]').val(vars[key]);
					oTable.search(vars[key]);
					oTable.draw();
				}
			} else {
				//Validate that the key is a column filter and populate it
				if($('input[name="' + key + '"]').length){
					$('input[name="' + key + '"]').val(value);
				}
			}
		}
		
		//Filter the table according to the column filters
		oTable.columns().every( function () {
	
			var that = this;
			
			columnvalue = $('input', this.header()).val();
			
			if(asInitVals.indexOf(columnvalue) == -1){
				$('input', this.header()).addClass('search_entered').removeClass('search_init');
				this.search(columnvalue);
				this.draw();
				expandPoolMatches($(oTable.table().body()), columnvalue)
				highlightAll(oTable);
			}
		});
		
		if(vars['showpool']){
			poolname = vars['showpool'].split('@')[0];
			loadbalancer = vars['showpool'].split('@')[1];
			
			showPoolDetails(poolname, loadbalancer);
		}
		
	}
}

function generateShareLink(){
	
	var base = window.location.origin + window.location.pathname;
	
	var sharequery = '?';
	var first = true;
	
	$('.search_entered').each(function(){
		if(asInitVals.indexOf(this.value) == -1){
			if(first){
				sharequery += this.name + '=' + this.value;
				first = false
			} else {
				sharequery += '&' + this.name + '=' + this.value;
			}
		}
	});
	
	if($('#allbigips_filter label input').val() != ""){
		if(first){
			sharequery += "global_search" + '=' + $('#allbigips_filter label input').val();
			first = false
		} else {
			sharequery += '&' + "global_search" + '=' + $('#allbigips_filter label input').val();
		}
	}
	
	return(base + sharequery);
	

}

function showShareLink(){
	
	var link = generateShareLink();
	$('#sharelink').val(link);
	$('#sharelink').focus();
	$('#sharelink').select();
	
}

function showPoolShareLink(pool){

	var link = generateShareLink();
	
	link += "&showpool=" + pool;
	
	$('#sharepoollink').val(link);
	$('#sharepoollink').focus();
	$('#sharepoollink').select();
	
}


/****************************************************************************************************************************** 
	Expands all pool matches in the main table when searching
******************************************************************************************************************************/


function expandPoolMatches(resultset, searchstring){
	
	if(localStorage.autoExpandPools !== "true"){
		$(resultset).children().children().filter("td:contains('" + searchstring + "')").each(function(){
			if(this.className == "PoolInformation"){
				togglePool(this);
			}
		});
	}
}

/****************************************************************************************************************************** 
	Collapses all pool cells in the main table
******************************************************************************************************************************/

function hidePools(){
	if(localStorage.autoExpandPools === "true"){
		$(".AssociatedPoolsInfo").hide();
		$('.pooltablediv').show();
		$('.collapse').show();
		$('.expand').hide();
	} else {
		$('.pooltablediv').hide();
		$('.collapse').hide();	
		$('.expand').show();	
		$('.AssociatedPoolsInfo').show();
	}
}

/****************************************************************************************************************************** 
	Expands/collapses a pool cell based on the id
******************************************************************************************************************************/

function togglePool(e){
	
	id = $(e).attr('data-vsid');
	
	//Store the current window selection
	var selection = window.getSelection();
	
	//If no text is selected, go ahead and expand or collapse the pool
	if(selection.type != "Range") {
		if($("#PoolInformation-" + id).is(":visible")){
			$('#AssociatedPoolsInfo-' + id).show();
			$('#expand-' + id).show();
			$('#collapse-' + id).hide();
			$('#PoolInformation-' + id).hide()
		} else {
			$('#AssociatedPoolsInfo-' + id).hide();
			$('#expand-' + id).hide();
			$('#collapse-' + id).show();
			$('#PoolInformation-' + id).show()
		}
	}

}

/****************************************************************************************************************************** 
	Set the max width of the pool cells in order to make the member column align
******************************************************************************************************************************/

function setPoolTableCellWidth(){

	var maxwidth=0
	$('.poolname').each(function(i, obj) {
		if(obj.offsetWidth > maxwidth){
			maxwidth = obj.offsetWidth
		}
	});

	console.log("Pool name Max-width:" + maxwidth)

	$('.poolname').each(function(i, obj) {
		if(obj.offsetWidth < maxwidth){
			obj.style.width = maxwidth
		}
	});

	var maxwidth=0
	$('.PoolMember').each(function(i, obj) {
		if(obj.offsetWidth > maxwidth){
			maxwidth = obj.offsetWidth
		}
	});

	$('.PoolMember').each(function(i, obj) {
		if(obj.offsetWidth < maxwidth){
			obj.style.width = maxwidth
		}
	});
}

/****************************************************************************************************************************** 
	Handles the highlight of content when searching
******************************************************************************************************************************/

function togglePoolHighlight(e){
	if(e.style.backgroundColor == ""){
		$('.' + e.className).css('background-color','#BCD4EC');
	} else {
		$('.' + e.className).css('background-color','');
	}
}


/********************************************************************************************************************************************************************************************

	Functions related to showing the pool details lightbox

********************************************************************************************************************************************************************************************/

/**********************************************************************************************************************
	Translates the status and availability of a member to less cryptic text and returns a dictionary
**********************************************************************************************************************/

function translateStatus(member) {
	
	translatedstatus = {
		availability: "",
		enabled: ""
	};
	
	switch(member.availability){
		case "AVAILABILITY_STATUS_GREEN":
			translatedstatus['availability'] = "UP";
			break;
		case "AVAILABILITY_STATUS_BLUE":
			translatedstatus['availability'] = "UNKNOWN";
			break;
		default:
			translatedstatus['availability'] = "DOWN";		
	}
	
	switch(member.enabled){
		case "ENABLED_STATUS_ENABLED":
			translatedstatus['enabled'] = "Enabled";
			break;
		case "ENABLED_STATUS_DISABLED_BY_PARENT":
			translatedstatus['enabled'] = "Disabled by parent";
			break;
		case "ENABLED_STATUS_DISABLED":
			translatedstatus['enabled'] = "Member disabled";
			break;
		default:  
			translatedstatus['enabled'] = "Unknown";
	}
	
	return translatedstatus;
	
}

/**********************************************************************************************************************
	Put the cursor in the input field holding the command and selects the text
**********************************************************************************************************************/

function selectMonitorInpuText(e){
	$(e).find("p input").focus();
	$(e).find("p input").select();	
}

/**********************************************************************************************************************
	Takes a monitor send string as parameter and returns a request object
**********************************************************************************************************************/

function getMonitorRequestParameters(sendstring){
	
	var sendstringarr = sendstring.split(" ");
	
	var request = { 
			verb : "",
			uri : "",
			headers : []
	}
	
	request['verb'] = sendstringarr[0];
	request['uri'] = sendstringarr[1].replace('\\r\\n', '');
	
	var headers = sendstring.split('\\r\\n');
	
	if(headers.length > 1){
		
		for(i=1;i<headers.length;i++){
			
			var header = headers[i];
			
			if(header.indexOf(":") >= 0){
				if(header.split(":").length == 2){
					request["headers"].push(header);
				}
			}
		}
	}

	return request
}

/**********************************************************************************************************************
	Shows the virtual server details light box
**********************************************************************************************************************/

function showVirtualServerDetails(virtualserver, loadbalancer){
	
	var matchingvirtualserver = "";
	
	//Find the matching pool from the JSON object
	for(var i in virtualservers){
		if(virtualservers[i].name == virtualserver && virtualservers[i].loadbalancer == loadbalancer) {
			matchingvirtualserver = virtualservers[i]
		}		
	}
	
	//If a pool was found, populate the pool details table and display it on the page
	if(matchingvirtualserver != ""){
				
		switch(matchingvirtualserver.sourcexlatetype){
			case "SRC_TRANS_NONE":
				var xlate = "None";		
				break;
			case "SRC_TRANS_AUTOMAP":
				var xlate = "Automap";
				break;
			case "SRC_TRANS_SNATPOOL":
				var xlate = "SNAT Pool " + matchingvirtualserver.sourcexlatetype;
				break;
			case "OLDVERSION":
				var xlate = "N/A in Bigip versions prior to 11.3";
				break;
			default:
				var xlate = "Unknown";
		}
		
		if(matchingvirtualserver.defaultpool == ""){
			 defaultpool = "N/A"
		} else {
			 defaultpool = matchingvirtualserver.defaultpool
		}
		
		
		//Build the table and headers
		$(".firstlayerdetailsheader").html(matchingvirtualserver.name);

		var table = '<table width="100%">';
		table += '	<tbody>';
		
		//First row containing simple properties in two cells which in turn contains subtables
		table += '		<tr>';
		table += '			<td valign="top">';
		
		//Subtable 1
		table += '				<table class="virtualserverdetailstable">';
		table += '					<tr><th>Name</th><td>' + matchingvirtualserver.name + '</td></tr>';
		table += '					<tr><th>IP:Port</th><td>' + matchingvirtualserver.ip + ':' + matchingvirtualserver.port + '</td></tr>';
		table += '					<tr><th>Default pool</th><td>' + defaultpool + '</td></tr>';
		table += '				</table>';
		table += '			</td>';
		
		//Subtable 2
		table += '			<td valign="top">';
		table += '				<table class="virtualserverdetailstable">';
		table += '					<tr><th>Client SSL Profile</th><td>' + matchingvirtualserver.sslprofile + '</td></tr>';
		table += '					<tr><th>Server SSL Profile</th><td>' + matchingvirtualserver.sslprofile + '</td></tr>';
		table += '					<tr><th>Compression Profile</th><td>' + matchingvirtualserver.compressionprofile + '</td></tr>';
		table += '					<tr><th>Persistence Profile</th><td>' + matchingvirtualserver.persistence + '</td></tr>';        
		table += '					<tr><th>Source Translation</th><td>' + xlate + '</td></tr>';
		table += '				</table>';
		table += '			</td>';
		table += '		</tr>';
		table += '	</tbody>';
		table += '</table>';
		table += '<br>';
		
		if(ShowiRules == true){
			if(matchingvirtualserver.irules.length > 0 && ShowiRules ){
				//Add the assigned irules
				table += '<table class="virtualserverdetailstable">';
				
				if(ShowiRuleLinks){
					table += '	<tr><th>iRule name</th><th>Matched data group lists</td></tr>';
				} else {
					table += '	<tr><th>iRule name</th></tr>';
				}
				
				for(var i in matchingvirtualserver.irules){
					
					// If iRules linking has been set to true show iRule links 
					// and parse data group lists
					if(ShowiRuleLinks){
						
						var iruleobj = getiRule(matchingvirtualserver.irules[i], loadbalancer);
                        
                        if(Object.keys(iruleobj).length === 0) {                            
                            table += '	<tr><td>' + matchingvirtualserver.irules[i] + '</td><td>N/A (empty rule)</td></tr>';
                        } else {
                            
                            var matcheddatagrouplists = ParseDataGroupLists(iruleobj);
                            
                            if(Object.keys(matcheddatagrouplists).length == 0){
                                var datagrouplistdata = ["N/A"];
                            } else {
                                
                                var datagrouplistdata = [];
                                
                                for(var dg in matcheddatagrouplists){
                                    
                                    var name = matcheddatagrouplists[dg].name;
                                    
                                    if(name.indexOf("/") >= 0){
                                        name = name.split("/")[2];
                                    }
                                    
                                    if(ShowDataGroupListsLinks){
                                        datagrouplistdata.push('<a href="javascript:void(0);" onClick="Javascript:showDataGroupListDetails(\'' + matcheddatagrouplists[dg].name + '\', \'' + loadbalancer + '\')">' + name + '</a>');
                                    } else {
                                        datagrouplistdata.push(name)
                                    }
                                }
                            }

                            table += '	<tr><td><a href="javascript:void(0);" onClick="Javascript:showiRuleDetails(\'' + iruleobj.name + '\', \'' + loadbalancer + '\')">' + iruleobj.name + '</a></td><td>' + datagrouplistdata.join("<br>") + '</td></tr>';
                        }
                    } else {
						table += '	<tr><td>' + matchingvirtualserver.irules[i] + '</td></tr>';
					}
				}
				
				table += '</table>';
			}
		} 
	}
	$('.firstlayerdetailsfooter').html('<a class="closelightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'.lightbox\').fadeOut();">Close virtual server details</a>');
	$("#firstlayerdetailscontentdiv").html(table);
	$("#firstlayerdiv").fadeIn();

}

/**********************************************************************************************************************
	Returns a matching irules object from the irules json data
**********************************************************************************************************************/

function getiRule(irule, loadbalancer){
	
	var matchingirule = {};

	//Find the matching irule from the JSON object
	for(var i in irules){
		
		if(irules[i].name == irule && irules[i].loadbalancer == loadbalancer) {
			matchingirule = irules[i];
		}
	}
	
	return matchingirule;
}

/**********************************************************************************************************************
	Shows the irule details light box
**********************************************************************************************************************/

function showiRuleDetails(irule, loadbalancer){
	
	//Get the rule object from the json file
	matchingirule = getiRule(irule, loadbalancer)
	
	//If an irule was found, prepare the data to show it
	if(matchingirule != ""){
		//Populate the header
		$(".secondlayerdetailsheader").html(matchingirule.name);
		
		
		
		//Save the definition to a variable for some classic string mangling
		var definition = matchingirule.definition
		
		//Replace those tags with to be sure that the content won't be interpreted as HTML by the browser
		definition = definition.replace(/</g, "&lt;").replace(/>/g, "&gt;")
		
		//Check if data group list links are wanted. Parse and create links if that's the base
		if(ShowDataGroupListsLinks == true) {
			
			//Then get the matching data group lists, if any
			connecteddatagrouplists = ParseDataGroupLists(matchingirule)
			
			//Check if any data group lists was detected in the irule
			if(Object.keys(connecteddatagrouplists).length > 0){
				//There was, let's loop through each
				for(var dg in connecteddatagrouplists){
					//First, prepare a regexp to replace all instances of the data group list with a link
					var regexp = new RegExp(dg, "g");
					//Prepare the link
					var dglink = '<a href="javascript:void(0);" onClick="Javascript:showDataGroupListDetails(\'' + connecteddatagrouplists[dg].name + '\', \'' + loadbalancer + '\')">' + dg + '</a>';
					//Do the actual replacement
					definition = definition.replace(regexp, dglink);
				}
			}
		}
		
		//Prepare the div content
		divcontent = '\
		<div class="iRulesContent">\
				<pre class="sh_tcl">' + definition + '</pre>\
			</div>\
		</div>';
	}
	
	//Add the close button to the footer
	$('.secondlayerdetailsfooter').html('<a class="closelightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'#secondlayerdetailsdiv\').fadeOut()">Close irule details</a>');
	//Add the div content to the page
	$("#secondlayerdetailscontentdiv").html(divcontent);
	//Add syntax highlighting
	sh_highlightDocument('/js/', '.js');
	//Show the div
	$("#secondlayerdetailsdiv").fadeIn();

}



/**********************************************************************************************************************
	Parse data group lists
**********************************************************************************************************************/


function ParseDataGroupLists(irule){

	/*
		Disclaimer. I know this one is very ugly, but since the commands potentially can do multiple levels 
		of brackets	I could not think of a better way
	*/

	var bracketcounter = 0;
	var tempstring = "";
	var detecteddict = {};	

	var irulepartition = irule.name.split("/")[1];
	var loadbalancer = irule.loadbalancer;
	
	//Go through the iRule and check for brackets. Save the string between the brackets.
	for(i=0;i<irule.definition.length;i++){
					
		if(irule.definition[i] == "[" && bracketcounter == 0){
			//A bracket has been found and if the bracketcounter is 0 this is the start of a command
			bracketcounter = 1;
		} else if(irule.definition[i] == "[") {
			//A bracket has been found and since the bracket counter is larger than 0 this is a nested command.
			bracketcounter +=1;
		} else if(irule.definition[i] == "#"){
			//Comment detected. Increase i until a new line has been detected or the end of the definition has been reached
			while(irule.definition[i] != "\n" && i != irule.definition.length){
				i++;
			}
			bracketcounter = 0;
			startindex = 0;
			tempstring = "";
			continue;
		}
		
		
		//The start of a command has been identified, save the character to a string
		if(bracketcounter > 0){
			tempstring += irule.definition[i];
		}
		
		if(irule.definition[i] == "]"){
			//if an end bracket comes along, decrease the bracket counter by one
			bracketcounter += -1
			
			//If the bracket counter is 0 after decreasing the bracket we have reached the end of a command
			if(bracketcounter == 0){
				
				//Separate the different words in the command with a regexp
				//Regexp based on the allowed characters specified by F5 in this article:
				//https://support.f5.com/kb/en-us/solutions/public/6000/800/sol6869.html
				var commandarray = tempstring.match(/[a-zA-Z0-9-_./]+/g)
				
				if(commandarray != null){
					//The actual command is the first word in the array. Later we'll be looking for class.
					var command = commandarray[0];
					
					//The subcommand is the second word. If class has been identified this will be match.
					var subcommand = commandarray[1];
					
					//Set an initial value of dg
					var dg = ""
					
					//If the command is class. I've chosen not to include matchclass for now since it is being deprecated
					if(command == "class"){
						switch(subcommand){
							case "lookup":
							case "match":
							case "element":
							case "type":
							case "exists":
							case "size":
							case "startsearch":
								//These types always has the data group list in the last element
								var dg = commandarray[commandarray.length-1]
								break;
							case "anymore":
							case "donesearch":
								//These types always has the data group list in the third element
								var dg = commandarray[2]
								break;
							case "search":
							case "names":
							case "get":
							case "nextelement":
								//Exclude options and find the data group list
								for(x=2;x<commandarray.length;x++){
									if(commandarray[x][0] != "-"){
										dg = commandarray[x];
									}
									
								}
								break;
						}
						
						
						if(dg != ""){
							
							if(ShowDataGroupListsLinks == false){
								var matchingdatagrouplist = {};
								matchingdatagrouplist["name"] = dg;
							} else if(dg.indexOf("/") >= 0){  
							//Check if a full path to a data group list has been specified and if it's legit
							
								//Possible match of a data group list with full pathname
								matchingdatagrouplist = getDataGroupList(dg, loadbalancer);
								if(matchingdatagrouplist == ""){
									//This did not match an existing data group list
									continue			
								}
							} else if ( getDataGroupList("/" + irulepartition + "/" + dg, loadbalancer) != "") {
								//It existed in the irule partition
								matchingdatagrouplist = getDataGroupList("/" + irulepartition + "/" + dg, loadbalancer);
							} else if (getDataGroupList("/Common/" + dg, loadbalancer) != ""){
								//It existed in the Common partition
								matchingdatagrouplist = getDataGroupList("/Common/" + dg, loadbalancer);
							} else {
								//No data group list was matched
								continue
							}
							
							//Check if the data group list has been detected before
							//If it hasn't, add it to the array of detected data group lists
							if(detecteddict[dg] >= 0){
								continue;
							} else {
								//Update the dictionary
								detecteddict[dg] = matchingdatagrouplist;
							}
						}
					}
				}
				
				tempstring = "";
			}
			
		}
		
		if(irule.definition[i] == "\n"){
			bracketcounter = 0;
			startindex = 0;
			tempstring = "";
		}
	}
	
	return(detecteddict);
}


/**********************************************************************************************************************
	Returns a matching data group list object from the data group list json data
**********************************************************************************************************************/

function getDataGroupList(datagrouplist, loadbalancer){
	
	var matchingdatagrouplist = "";
	
	//Find the matching data group list from the JSON object
	for(var i in datagrouplists){
		if(datagrouplists[i].name == datagrouplist && datagrouplists[i].loadbalancer == loadbalancer) {
			matchingdatagrouplist = datagrouplists[i];
		}
	}
	
	return matchingdatagrouplist;
}


/**********************************************************************************************************************
	Displays a data group list in a lightbox
**********************************************************************************************************************/

function showDataGroupListDetails(datagrouplist, loadbalancer){
	
	//Get a matching data group list from the json data
	matchingdatagrouplist = getDataGroupList(datagrouplist, loadbalancer)
	
	//If a pool was found, populate the pool details table and display it on the page
	if(matchingdatagrouplist != ""){
		
		$(".secondlayerdetailsheader").html(matchingdatagrouplist.name);
		
		divcontent = "<div class=datagrouplistcontentdiv>" +
						"<span class=\"dgtype\">Type: " + matchingdatagrouplist.type + "</span><br><br>";
						"<span class=\"dgtype\">Type: " + matchingdatagrouplist.type + "</span><br><br>";
		
		divcontent += "<table class=\"datagrouplisttable\">\
							<thead>\
								<tr><th class=\"keyheader\">Key</th><th class=\"valueheader\">Value</th></tr>\
							</thead>\
							<tbody>"
		
		if(Object.keys(matchingdatagrouplist).length == 0){
			divcontent += "<tr class=\"emptydg\"><td colspan=\"2\">Empty data group list</td></tr>"
		} else {
			for(var i in matchingdatagrouplist.data){
				divcontent += "<tr><td class=\"dgkey\">" + i + "</td><td class=\"dgvalue\">" + matchingdatagrouplist.data[i] + "</td></tr>";
			}
		}
		
		divcontent += "</tbody></table\">"
		
		divcontent += '</div>';

	}
	
	$('#secondlayerdetailsfooter').html('<a class="closelightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'#secondlayerdetailsdiv\').fadeOut()">Close data group list details</a>');
	$("#secondlayerdetailscontentdiv").html(divcontent);
	$("#secondlayerdetailsdiv").fadeIn();

}



/**********************************************************************************************************************
	Shows the pool details light box
**********************************************************************************************************************/

function showPoolDetails(pool, loadbalancer){

	var matchingpool = "";
	
	//Find the matching pool from the JSON object
	for(var i in pools){
		if(pools[i].name == pool && pools[i].loadbalancer == loadbalancer) {
			matchingpool = pools[i]
		}		
	}
	
	//If a pool was found, populate the pool details table and display it on the page
	if(matchingpool != ""){
		
		//Build the table and headers
		$(".firstlayerdetailsheader").html(matchingpool.name);
		
		table = '<table class="pooldetailstable">';
		table += '	<thead><tr><th>Member name</th><th>Member IP</th><th>Port</th><th>Priority group</td><th>Member availability</th><th>Enabled</th><th>Member Status description</th></tr></thead><tbody>';
		
		poolmonitors = matchingpool.monitors

		matchingmonitors = [];
		
		for(var i in poolmonitors){
			
			for(var x in monitors){
				if(monitors[x].name == poolmonitors[i] && monitors[x].loadbalancer == loadbalancer){
					matchingmonitors.push(monitors[x]);
				}
			}
		}		
		
		var members = matchingpool.members;
		
		for(var i in members){
			
			member = members[i];
			memberstatus = translateStatus(member);
			
			table += '<tr><td>' + member.name + '</td><td>' + member.ip + '</td><td>' + member.port + '</td><td>' + member.priority + '<td>' + memberstatus['availability'] + '</td><td>' + memberstatus['enabled'] + '</td><td>' + member.status + '</td></tr>';
		}	
		
		
		
		table += '</tbody></table>';
		table += '<br>';
		
		//table += '<div class="closelightboxbuttonholder"><a href="javascript:void(0);" onMouseClick="" onMouseOver="javascript:showShareLink()" class="sharelink"><button>Share search</button><p>CTRL + C to copy<br><input id="sharelink" value=""></p></a></div><br>'
		
		if(matchingmonitors.length > 0){
			
			table += '<div class="monitordetailsheader">Assigned monitors</div>'
			
			for(var i in matchingmonitors){
				
				matchingmonitor = matchingmonitors[i];
				
				matchingmonitor.receivestring = matchingmonitor.receivestring.replace('<', '&lt;').replace('>', '&gt;');
				
				table += '	<table class="monitordetailstable">';
				table += '	<thead><tr><th colspan=2>' + matchingmonitor.name + '</th></thead><tbody>';
				table += '	<tr><td class="monitordetailstablerowheader"><b>Type</td><td>' + matchingmonitor.type + '</b></td></tr>'
				table += '	<tr><td class="monitordetailstablerowheader"><b>Send string</td><td>' + matchingmonitor.sendstring + '</b></td></tr>'
				table += '	<tr><td class="monitordetailstablerowheader"><b>Receive string</b></td><td>' + matchingmonitor.receivestring + '</td></tr>'
				table += '	<tr><td class="monitordetailstablerowheader"><b>Interval</b></td><td>' + matchingmonitor.interval + '</td></tr>'
				table += '	<tr><td class="monitordetailstablerowheader"><b>Timeout</b></td><td>' + matchingmonitor.timeout + '</td></tr>'
				table += '	</table>';
				
				
				table += '	<table class="membermonitortable">';
				table += '	<thead><tr><th>Member name</th><th>Member ip</th><th>Member port</th><th>HTTP link</th><th>Curl link</th><th>Netcat link</th></thead><tbody>';
			
				for(var x in members){
				
					member = members[x];
					memberstatus = translateStatus(member);
														
					var protocol = '';
					
					if(matchingmonitors[i].type.indexOf("HTTPS") >=0){
						protocol = 'https';
					} else if(matchingmonitors[i].type.indexOf("HTTP") >=0){
						protocol = 'http';
					}
					
					if(protocol != ''){
						
						sendstring = matchingmonitors[i].sendstring;
						
						requestparameters = getMonitorRequestParameters(sendstring)
						globheader = requestparameters;
						if(requestparameters['verb'] == "GET"){
													
							var curlcommand = 'curl';
							
							for(var x in requestparameters['headers']){
								header = requestparameters['headers'][x];
								headerarr = header.split(":");
								headername = headerarr[0].trim();
								headervalue = headerarr[1].trim();
								
								curlcommand += ' --header &quot;' + headername + ': ' + headervalue + '&quot;';
							}
							
							curlcommand += ' ' + protocol + '://' + member.ip + ':' + member.port + requestparameters['uri'];
												
							var netcatcommand = "echo -ne \"" + sendstring + "\" | nc " + member.ip + " " + member.port;
							
							var url = protocol + '://' + member.ip + ':' + member.port + requestparameters['uri'];
							
							var httplink = '<a href="javascript:void(0);" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)" data-type="http">HTTP<p>HTTP Link (CTL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="' + url +'"></p></a>';
							
							var curllink = '<a href="javascript:void(0);" target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)" data-type="curl">Curl<p>Curl command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value="' + curlcommand +'"></p></a>';
							
							var netcatlink = '<a href="javascript:void(0); target="_blank" class="monitortest" onmouseover="javascript:selectMonitorInpuText(this)" data-type="netcat">Netcat<p>Netcat command (CTRL+C)<input id="curlcommand" class="monitorcopybox" type="text" value=\'' + netcatcommand +'\'></p></a>';
							
							table += '<tr><td>' + member.name + '</td><td>' + member.ip + '</td><td>' + member.port + '</td><td>' + httplink + '</td><td>' + curllink + '</td><td>' + netcatlink + '</td></tr>';
							
						} else {
							table += '<tr><td>' + member.name +'</td><td>' + member.ip  + '</td><td>' + member.port + '</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>';
						}
					} else {
						table += '<tr><td>' + member.name +'</td><td>' + member.ip  + '</td><td>' + member.port + '</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>';
					}
				}
				
				table += '	</table>';
				table += '	<br>';
				
			}
		
			
			table += '</tbody></table>';
		}
		
		
		$('#firstlayerdetailsfooter').html('<a class="closelightboxbutton" href="javascript:void(0);" onClick="javascript:$(\'.lightbox\').fadeOut()">Close pool details</a><a href="javascript:void(0);" onMouseClick="" onMouseOver="javascript:showPoolShareLink(\'' + pool +'@' + loadbalancer + '\')" class="sharepoollink">Share pool details<p>CTRL + C to copy<br><input id="sharepoollink" value=""></p></a>');

	}

	$("#firstlayerdetailscontentdiv").html(table);
	$("#firstlayerdiv").fadeIn();

}

function loadPreferences(){
	for(var k in defaultPreferences){
		if(localStorage.getItem(k) === null){ localStorage.setItem(k, defaultPreferences[k]) }
	}
}