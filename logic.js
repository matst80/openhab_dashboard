(function(d,w,opt) {


	function createClass(name, parent, func) {
			var initdata = {};
			if (!parent) {
					console.log(name, 'NO PARENT PROTOTYPE');
					return null;
			}

			var newf = function () {
					var t = this;

					for (i in initdata) {
							t[i] = initdata[i];
					}



					if (t.preInit)
							t.preInit.apply(t, arguments);
					t.init.apply(t, arguments);

			};

			newf.prototype = new parent();
			newf.prototype.constructor = newf;
			newf.prototype.parent = parent.prototype;

			if (arguments.length > 3) {
					for (var i = 2; i < arguments.length; i++) {
							$.extend(func, arguments[i]);
					}
			}

			hdl.types[name] = newf;
			for (i in func) {
					var fnc = func[i];
					if (fnc.constructor == Function)
							newf.prototype[i] = fnc;
					else
							initdata[i] = fnc;
			}
			return newf;
	}
	//w.createType = createClass;


			var cbId = 0;

			function EL(nodeName,opt,prt) {
				var r = d.createElement(nodeName);
				if (opt)
					for(var i in opt) {
						var l = opt[i];
						if (i=='classList')
						{
							for(var j=0;j<l.length;j++) {
								r.classList.add(l[j]);
							}
						}
						r[i] = l;
					}
				if(prt)
					prt.appendChild(r);
				return r;
			}
/*
			function appendItem(itemData,elm) {
				var	tp = itemData.type,
					data = elm.dataset,
					ie = EL('div',{classList:['itm',itemData.type.toLowerCase().replace('item',''),data.color||'inherit-color']},elm),
					icn = EL('div',{classList:['fa','fa-'+(data.icon||'lightbulb-o'),'symbol']},ie),
					lbl = EL('div',{innerHTML:data.label||itemData.name},ie),
					cl = ie.classList;

				var itemVal;
				data.state = itemData.state;
				//icn.classList.add('fa','fa-'+(data.icon||'lightbulb-o'),'symbol')
				ie.addEventListener('click',function() {
					setState(itemData.link,data.state=='ON'?'OFF':'ON')
				});
				switch(tp) {
					case 'SwitchItem':
						cl.add(itemData.state);
						break;
					case 'NumberItem':
						var nxt ='';
						var format = data.format||'{0}';
						var format2 = data.formatsecond||'{0}';
						if (data.itemsecond)
						{
							nxt = format2.replace('{0}',Math.round(allItems[data.itemsecond].state));
						}
						EL('span',{classList:['itemvalue'],innerHTML:format.replace('{0}',Math.round(itemData.state))+' '+nxt},ie);

						break;
					case 'GroupItem':
						urlCallback(itemData.link+'?type=jsonp',function(d) {
							console.log('groupdata',d);
							var all = d.members.length;
							var on = 0;
							d.members.forEach(function(v,i) {
								if (v.state=='ON')
									on++;
							});
							EL('span',{innerHTML:on+'/'+all,classList:['grp-lbl']},lbl);
						});
						break;
				}

				hookItemChange(itemData.name,function(d) {
					cl.remove(itemData.state);
					cl.add(d);
					itemData.state = d;
					data.state = d;
				});
			}
*/
			function initItems() {
				var itemElms = d.getElementsByTagName('widget');
				for(var i=0;i<itemElms.length;i++) {
					var elm = itemElms[i],
						data = elm.dataset;
					if (data.item || data.type) {
						var ohData = {};
						if (data.item && allItems[data.item]) {
							ohData = allItems[data.item];
						}
						var type = data.type||(ohData.type || 'baseitem');
						if (!hdl.types[type])
							console.log('handler not found for ',type);
						else {
								try {
									elm.dashboardItem = new hdl.types[type]({openhabItem:ohData,dataset:data,element:elm});
								}
								catch(err) {
									console.log('class not initiated',err,type);
								}
							}
						//appendItem(allItems[data.item],elm);
					}
				}
			}

			function urlCallback(url,cb,cbparam) {
				var nm = 'jsonp_'+(cbId++);
				w[nm] = cb;
				var el = d.createElement('script');
				el.type = 'text/javascript';
				var ch = url.indexOf('?')==-1?'?':'&';
				el.src = url+ch+(cbparam||'jsoncallback')+'='+nm;
				d.body.appendChild(el);
			}

			var allItems;
			function findWidgets() {
			urlCallback('http:'+opt.host+'/rest/items?type=jsonp',function(d) {
				allItems = {};
				d.item.forEach(function(v,i) {
					console.log(v);
					allItems[v.name] = v;
				});
				w.dataHandler.items = allItems;
				initItems();
			});
		}
			/*urlCallback('http://192.168.11.27:8080/rest/sitemaps/default?type=jsonp',function(d) {
				console.log('data',d);
			});*/

			function setState(link,val) {
				var xhReq = new XMLHttpRequest();
				xhReq.open("POST", link);
	 			xhReq.setRequestHeader('Content-Type', 'text/plain');
	 			xhReq.send(val);
			}

			function hookItemChange(itm,cb) {
				var io = new WebSocket('ws:'+opt.host+'/rest/items/'+itm+'/state');
				io.onmessage = function(e) {
					cb(e.data);
				}
			}
			var hdl = w.dataHandler = {
				start:function() {
					findWidgets();
				},
				items:[],
				types:{},
				createType:createClass,
				setItemState:setState,
				newElm:EL,
				hookItemChange:hookItemChange,
				requestData:urlCallback
			};


		})(document,window,defaults);
