// Applet : Configurable Menu      Version      : v0.3-Beta
// O.S.   : Cinnamon               Release Date : 02 Dicember 2013.
// Author : Lester Carballo Pérez  Email        : lestcape@gmail.com
//
// Website : https://github.com/lestcape/Configurable-Menu
//
// This is a frock of Main Cinnamon menu applet with more configurable options.
//
// Skills including:
//
//    1- Can be active OnButtonPress action instead of OnButtonRelease.
//    2- You can control the menu with scrolling the height.
//    3- Support for theme change.
//    4- Enable and disable favorites.
//    5- Separate power button of favorites.
//    6- And more for the future.
//
// This program is free software:
//
//    You can redistribute it and/or modify it under the terms of the
//    GNU General Public License as published by the Free Software
//    Foundation, either version 3 of the License, or (at your option)
//    any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.


/*

const Signals = imports.signals;
const FileUtils = imports.misc.fileUtils;





const ICON_SIZE = 16;
const CATEGORY_ICON_SIZE = 22;

const USER_DESKTOP_PATH = FileUtils.getUserDesktopDir();


*/
const Util = imports.misc.util;
const Tweener = imports.ui.tweener;
const Pango = imports.gi.Pango;
const DND = imports.ui.dnd;
const GMenu = imports.gi.GMenu;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Applet = imports.ui.applet;
const ScreenSaver = imports.misc.screenSaver;
const GnomeSession = imports.misc.gnomeSession;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
const DocInfo = imports.misc.docInfo;
const Lang = imports.lang;
const AppFavorites = imports.ui.appFavorites;
const GLib = imports.gi.GLib;
const AccountsService = imports.gi.AccountsService;

const AppletPath = imports.ui.appletManager.applets['configurableMenu@lestcape'];
const CinnamonMenu = AppletPath.cinnamonMenu;

let appsys = Cinnamon.AppSystem.get_default();
const MAX_FAV_ICON_SIZE = 32;
const HOVER_ICON_SIZE = 68;
const APPLICATION_ICON_SIZE = 22;
const MAX_RECENT_FILES = 20;
/*
const LIB_PATH = '/usr/share/cinnamon/applets/menu@cinnamon.org';
imports.searchPath.unshift(LIB_PATH);
const CinnamonMenu = imports.applet;
*/

function TimeAndDate(){
    this._init();
}

TimeAndDate.prototype = {
   _init: function(metadata) {
      this.dateFormat = "%A,%e %B";
      this.dateSize = "6pt";
      this.timeFormat = "%H:%M";
      this.timeSize = "15pt";
      this.timeout = 0;

      this._clockContainer = new St.BoxLayout({vertical:true, style_class: 'clock-container'});	
      this._dateContainer =  new St.BoxLayout({vertical:false, style_class: 'date-container'});
      this._timeContainer =  new St.BoxLayout({vertical:false, style_class: 'time-container'});

      this._date = new St.Label();
      this._time = new St.Label();
      this._dateContainer.add(this._date);
      this._timeContainer.add(this._time);

      this._clockContainer.add(this._timeContainer, {x_fill: false, x_align: St.Align.MIDDLE});
      this._clockContainer.add(this._dateContainer, {x_fill: false, x_align: St.Align.MIDDLE});

      this.actor = this._clockContainer;
      this._date.style="font-size: " + this.dateSize;
      this._time.style="font-size: " + this.timeSize;
   },

   startTimer: function() {
      if(this.timeout == 0) {
         this.timeout = 1;
         this._updateDate();
      }
   },

   closeTimer: function() {
      if(this.timeout > 0)
         Mainloop.source_remove(this.timeout);
      this.timeout = 0;
   },

   setDateFormat: function(format) {
      this.dateFormat = format;
      this.refrech();
   },

   setTimeFormat: function(format) {
      this.timeFormat = format;
      this.refrech();
   },

   setDateSize: function(size) {
      this.dateSize = size + "pt";
      this._date.style="font-size: " + this.dateSize;
      this.refrech();
   },

   setTimeSize: function(size) {
      this.timeSize = size + "pt";
      this._time.style="font-size: " + this.timeSize;
      this.refrech();
   },

   setClockVisible: function(visible) {
      this._timeContainer.visible = visible;
      if(visible)
         this.startTimer();
      else
         this.closeTimer();
   },

   setDateVisible: function(visible) {
      this._dateContainer.visible = visible;
   },

   setAlign: function(align) {
      this._clockContainer.remove_actor(this._timeContainer);
      this._clockContainer.remove_actor(this._dateContainer);
      this._clockContainer.add(this._timeContainer, {x_fill: false, x_align: align});
      this._clockContainer.add(this._dateContainer, {x_fill: false, x_align: align});
      this.refrech();
   },

   refrech: function() {
      let displayDate = new Date();
      this._time.set_text(displayDate.toLocaleFormat(this.timeFormat));
      this._date.set_text(displayDate.toLocaleFormat(this.dateFormat));
   },
   _updateDate: function() {
      // let timeFormat = '%H:%M';
      // let dateFormat = '%A,%e %B';
      this.refrech();
      if(this.timeout > 0)
         this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateDate));
   }
};

function VisibleChildIteratorExtended(parent, container, numberView) {
    this._init(parent, container, numberView);
}

VisibleChildIteratorExtended.prototype = {
   __proto__: CinnamonMenu.VisibleChildIterator.prototype,
   _init: function(parent, container, numberView) {
      this.container = container;
      this._parent = parent;
      this._numberView = numberView;
      this._num_children = 0;
      this.reloadVisible();
   },

   reloadVisible: function() {
      try {
      if(this._numberView == 1) {
         this.visible_children = new Array();
         this.abs_index = new Array();
         let child;
         let children = this.container.get_children();
         for (let i = 0; i < children.length; i++) {
            child = children[i];
            if (child.visible) {
                this.visible_children.push(child);
                this.abs_index.push(i);
            }
         }
      }
      else {
         this.visible_children = new Array();
         this.abs_index = new Array();
         this.inter_index = new Array();
         let child, internalBox, intIndex;
         let children = this.container.get_children();
         for(let j = 0; j < children.length; j++) {
            internalBox = children[j].get_children();
            intIndex = 0;
            for(let i = 0; i < internalBox.length; i++) {
               child = internalBox[i];
               if(child.visible) {
                  this.visible_children.push(child);
                  this.abs_index.push(j);
                  this.inter_index.push(intIndex);
                  intIndex++;
               }
            }
         }
      }
      this._num_children = this.visible_children.length;
      } catch(e) {
         Main.notify(e.message);
      }
   },

   setNumberView: function(numberView) {
      this._numberView = numberView;
   },

   getNextVisible: function(cur_child) {
      if(this.visible_children.indexOf(cur_child) == this._num_children-1)
         return this.visible_children[0];
      else
         return this.visible_children[this.visible_children.indexOf(cur_child)+1];
   },

   getPrevVisible: function(cur_child) {
      if(this.visible_children.indexOf(cur_child) == 0)
         return this.visible_children[this._num_children-1];
      else
         return this.visible_children[this.visible_children.indexOf(cur_child)-1];
   },

   getItemGridByIndex: function(rowIndex, colIndex) {
      let posVisible = rowIndex*this._numberView + colIndex;
      if((posVisible > -1)&&(posVisible < this._num_children))
         return this.visible_children[posVisible];
      return this.getLastVisible();
   },

   getUpperVisible: function(cur_child) {
      let rowIndex = Math.floor(this.visible_children.indexOf(cur_child)/this._numberView);
      let colIndex = this.getInternalIndexOfChild(cur_child);
      if(rowIndex == 0)
         return this.getItemGridByIndex(Math.floor((this.abs_index.length - 1)/this._numberView), colIndex);
      else
         return this.getItemGridByIndex(rowIndex - 1, colIndex);
   },

   getDownVisible: function(cur_child) {
      let rowIndex = Math.floor(this.visible_children.indexOf(cur_child)/this._numberView);
      let colIndex = this.getInternalIndexOfChild(cur_child);
      if(rowIndex == Math.floor((this.abs_index.length - 1)/this._numberView))
         return this.getItemGridByIndex(0, colIndex);
      else
         return this.getItemGridByIndex(rowIndex + 1, colIndex);
   },

   getFirstVisible: function() {
      return this.visible_children[0];
   },

   getLastVisible: function() {
      return this.visible_children[this._num_children-1];
   },

   getVisibleIndex: function(cur_child) {
      return this.visible_children.indexOf(cur_child);
   },

   getVisibleItem: function(index) {
      return this.visible_children[index];
   },

   getNumVisibleChildren: function() {
      return this._num_children;
   },

   getInternalIndexOfChild: function(child) {
      if(this.inter_index)
         return this.inter_index[this.visible_children.indexOf(child)];
      return 0;
   },

   getAbsoluteIndexOfChild: function(child) {
      return this.abs_index[this.visible_children.indexOf(child)];
   }
};

function HoverIcon(parent) {
    this._init(parent);
}

HoverIcon.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      try {
         //this.actor._delegate = this;
         this.actor.style = "padding-top: "+(0)+"px;padding-bottom: "+(0)+"px;padding-left: "+(0)+"px;padding-right: "+(0)+"px;margin:auto;";
         this._userIcon = new St.Icon({ icon_size: HOVER_ICON_SIZE });
         this.icon = new St.Icon({ icon_size: HOVER_ICON_SIZE, icon_type: St.IconType.FULLCOLOR });
         this.parent = parent;
         
         this.menu = new PopupMenu.PopupSubMenu(this.actor);
         this.menu.actor.set_style_class_name('menu-context-menu');
         this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));

         this._user = AccountsService.UserManager.get_default().get_user(GLib.get_user_name());
         this._userLoadedId = this._user.connect('notify::is_loaded', Lang.bind(this, this._onUserChanged));
         this._userChangedId = this._user.connect('changed', Lang.bind(this, this._onUserChanged));

         let menuItem;
         let userBox = new St.BoxLayout({ style_class: 'user-box', vertical: false });
         this.userLabel = new St.Label(({ /*style_class: 'user-label'*/}));
         userBox.add(this.userLabel, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE }); 
         this.menu.addActor(userBox);

        // this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

         this.notificationsSwitch = new PopupMenu.PopupSwitchMenuItem(_("Notifications"), this._toggleNotifications);
         this.menu.addMenuItem(this.notificationsSwitch);
         global.settings.connect('changed::display-notifications', Lang.bind(this, function() {
            this.notificationsSwitch.setToggleState(global.settings.get_boolean("display-notifications"));
         }));
         this.notificationsSwitch.connect('toggled', Lang.bind(this, function() {
            global.settings.set_boolean("display-notifications", this.notificationsSwitch.state);
         }));

         this.account = new PopupMenu.PopupMenuItem(_("Account Details"));
         this.menu.addMenuItem(this.account);
         this.account.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine("cinnamon-settings user");
         }));

         this._onUserChanged();
         this.refreshFace();
      } catch(e) {
         Main.notifyError("Error:",e.message);
      }
      
   },

   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button()==1) {
         this.activate(event);
      }
      if(event.get_button()==3) {
         this.toggleMenu();
      }
      return true;
   },

   _subMenuOpenStateChanged: function() {
       //if (this.menu.isOpen) this.appsMenuButton._scrollToButton(this.menu);
       if(!this.menu.isOpen) {
          this.parent.searchEntry.set_width(-1);
          //this.menu.actor.can_focus = false;
       }
       /*else
          this.menu.actor.can_focus = true;*/
   },
    
   activate: function(event) {
      //this.parent.menu.close();
      //Main.notify("close");
      //PopupBaseMenuItem.prototype.activate.call(this, event, true);
   },

   closeMenu: function() {
      this.menu.close();
   },
    
   toggleMenu: function() {
      if(!this.menu.isOpen)
         this.parent.searchEntry.set_width(200);
      this.menu.toggle();
   },

   _onUserChanged: function() {
      if(this._user.is_loaded) {
         this.userLabel.set_text (this._user.get_real_name());
         if(this._userIcon) {

            let iconFileName = this._user.get_icon_file();
            let iconFile = Gio.file_new_for_path(iconFileName);
            let icon;
            if(iconFile.query_exists(null)) {
               icon = new Gio.FileIcon({file: iconFile});
            } else {
               icon = new Gio.ThemedIcon({name: 'avatar-default'});
            }
            this._userIcon.set_gicon(icon);
            this._userIcon.show(); 
 
         }
      }
   },

   refresh: function (icon) {
      if(this.lastApp)
         this.removeActor(this.lastApp);
      this.removeActor(this._userIcon);
      this.removeActor(this.icon);
      this.addActor(this.icon);
      this.icon.set_icon_name(icon);
   },

   refreshApp: function (app) {
      this.removeActor(this._userIcon);
      this.removeActor(this.icon);
      if(this.lastApp)
         this.removeActor(this.lastApp);
      this.lastApp = app.create_icon_texture(HOVER_ICON_SIZE);
      this.addActor(this.lastApp);
   },

   refreshPlace: function (place) {
      this.removeActor(this._userIcon);
      this.removeActor(this.icon);
      if(this.lastApp)
         this.removeActor(this.lastApp);
      this.lastApp = place.iconFactory(HOVER_ICON_SIZE);
      this.addActor(this.lastApp);
   },

   refreshFile: function (file) {
      this.removeActor(this._userIcon);
      this.removeActor(this.icon);
      if(this.lastApp)
         this.removeActor(this.lastApp);
      this.lastApp = file.createIcon(HOVER_ICON_SIZE);
      this.addActor(this.lastApp);
   },

   refreshFace: function () {
      if(this.lastApp)
         this.removeActor(this.lastApp);
      this.removeActor(this.icon);
      this.removeActor(this._userIcon);
      this.addActor(this._userIcon);
   }
};

function SystemButton(appsMenuButton, icon, nbFavorites, title, description, hoverIcon) {
    this._init(appsMenuButton, icon, nbFavorites, title, description, hoverIcon);
}

SystemButton.prototype = {

   _init: function(appsMenuButton, icon, nbFavorites, title, description, hoverIcon) {
      this.actor = new St.Button({ reactive: true, style_class: 'menu-favorites-button' });
      this.icon = icon;
      this.title = title;
      this.description = description;
      this.actionCallBack = null;
      this.active = false;
      this.hoverIcon = hoverIcon;
      let monitorHeight = Main.layoutManager.primaryMonitor.height;
      let real_size = (0.7*monitorHeight) / nbFavorites;
      let icon_size = 0.6*real_size;
      if (icon_size>MAX_FAV_ICON_SIZE) icon_size = MAX_FAV_ICON_SIZE;
      this.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(2)+"px;padding-right: "+(2)+"px;margin:auto;";
      let iconObj = new St.Icon({icon_name: icon, icon_size: icon_size, icon_type: St.IconType.FULLCOLOR});
      this.actor.set_child(iconObj);
      //this.actor.connect()
      iconObj.realize()
   },

   setAction: function(actionCallBack) {
      this.actionCallBack = actionCallBack;
      this.actor.connect('clicked', actionCallBack);
   },

   executeAction: function() {
      if(this.actionCallBack)
         this.actionCallBack();
   },

   setActive: function(active) {
      this.active = active;
      if(this.active) {
         this.hoverIcon.refresh(this.icon);
         this.actor.set_style_class_name('menu-category-button-selected');
      }
      else {
         this.hoverIcon.refreshFace();
         this.actor.set_style_class_name('menu-favorites-button');
      }
   }
};

function ApplicationButtonExtended(appsMenuButton, app) {
    this._init(appsMenuButton, app);
}

ApplicationButtonExtended.prototype = {
    __proto__: CinnamonMenu.ApplicationButton.prototype,
    
    _init: function(appsMenuButton, app) {
        CinnamonMenu.GenericApplicationButton.prototype._init.call(this, appsMenuButton, app, true);
        this.category = new Array();
        this.actor.set_style_class_name('menu-application-button');
        this.icon = this.app.create_icon_texture(APPLICATION_ICON_SIZE);
        this.name = this.app.get_name();
        this.label = new St.Label({ text: this.name , style_class: 'menu-application-button-label' });
        this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
        //this.label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        //this.label.clutter_text.set_justify (true);
        this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
        //  this.label.clutter_text.line-alignment = Pango.Alignment.RIGHT;
        this.container = new St.BoxLayout();
        this.textBox = new St.BoxLayout({ vertical: false });
        this.setVertical(false);

        this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
        this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
        this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
        this.addActor(this.container);
        this._draggable = DND.makeDraggable(this.actor);
        this.isDraggableApp = true;
        this.icon.realize();
        this.label.realize();
    },

    setVertical: function(vertical) {
       this.container.set_vertical(vertical);
       this.label.clutter_text.line_wrap = vertical;
       if(vertical) {
          this.textBox.set_width(4*APPLICATION_ICON_SIZE);
          this.textBox.set_height(1.4*APPLICATION_ICON_SIZE);
          
       }
       else {
          this.textBox.set_width(-1);
          this.textBox.set_height(-1);
       }
    }
};

function PlaceButtonExtended(appsMenuButton, place, button_name) {
    this._init(appsMenuButton, place, button_name);
}

PlaceButtonExtended.prototype = {
    __proto__: CinnamonMenu.PlaceButton.prototype,

    _init: function(appsMenuButton, place, button_name) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
        this.appsMenuButton = appsMenuButton;
        this.place = place;
        this.button_name = button_name;
        this.actor.set_style_class_name('menu-application-button');
        this.actor._delegate = this;
        this.label = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
        //this.label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        //this.label.clutter_text.set_justify (true);
        this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
        //  this.label.clutter_text.line-alignment = Pango.Alignment.RIGHT;
        this.container = new St.BoxLayout();
        this.textBox = new St.BoxLayout({ vertical: false });
        this.setVertical(false);

        this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
        this.icon = place.iconFactory(APPLICATION_ICON_SIZE);
        if(!this.icon)
           this.icon = new St.Icon({icon_name: "folder", icon_size: APPLICATION_ICON_SIZE, icon_type: St.IconType.FULLCOLOR});
        if(this.icon)
           this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
        this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

        this.addActor(this.container);
        this.icon.realize();
        this.label.realize();
    },

    setVertical: function(vertical) {
       this.container.set_vertical(vertical);
       this.label.clutter_text.line_wrap = vertical;
       if(vertical) {
          this.textBox.set_width(4*APPLICATION_ICON_SIZE);
          this.textBox.set_height(1.4*APPLICATION_ICON_SIZE);
          
       }
       else {
          this.textBox.set_width(-1);
          this.textBox.set_height(-1);
       }
    }
};

function RecentButtonExtended(appsMenuButton, file) {
    this._init(appsMenuButton, file);
}

RecentButtonExtended.prototype = {
    __proto__: CinnamonMenu.RecentButton.prototype,

    _init: function(appsMenuButton, file) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
        this.file = file;
        this.appsMenuButton = appsMenuButton;
        this.button_name = this.file.name;
        this.actor.set_style_class_name('menu-application-button');
        this.actor._delegate = this;
        this.label = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
        this.label.set_style("max-width: 250px;");
        this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
        //this.label.clutter_text.set_justify (true);
        this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
        //  this.label.clutter_text.line-alignment = Pango.Alignment.RIGHT;
        this.container = new St.BoxLayout();
        this.textBox = new St.BoxLayout({ vertical: false });
        this.setVertical(false);

        this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
        this.icon = file.createIcon(APPLICATION_ICON_SIZE);
        this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
        this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

        this.addActor(this.container);
        this.icon.realize();
        this.label.realize();
    },

    setVertical: function(vertical) {
       this.container.set_vertical(vertical);
       this.label.clutter_text.line_wrap = vertical;
       if(vertical) {
          this.textBox.set_width(4*APPLICATION_ICON_SIZE);
          this.textBox.set_height(1.4*APPLICATION_ICON_SIZE);
          
       }
       else {
          this.textBox.set_width(-1);
          this.textBox.set_height(-1);
       }
    }
};

function RecentClearButtonExtended(appsMenuButton) {
    this._init(appsMenuButton);
}

RecentClearButtonExtended.prototype = {
    __proto__: CinnamonMenu.RecentClearButton.prototype,

    _init: function(appsMenuButton) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
        this.appsMenuButton = appsMenuButton;
        this.actor.set_style_class_name('menu-application-button');
        this.button_name = _("Clear list");
        this.actor._delegate = this;
        this.label = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
        //this.label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        //this.label.clutter_text.set_justify (true);
        this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
        //  this.label.clutter_text.line-alignment = Pango.Alignment.RIGHT;
        this.container = new St.BoxLayout();
        this.textBox = new St.BoxLayout({ vertical: false });
        this.setVertical(false);

        this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
        this.icon = new St.Icon({ icon_name: 'edit-clear', icon_type: St.IconType.SYMBOLIC, icon_size: APPLICATION_ICON_SIZE });
        this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
        this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });

        this.addActor(this.container);
        this.icon.realize();
        this.label.realize();
    },

    setVertical: function(vertical) {
       this.container.set_vertical(vertical);
       this.label.clutter_text.line_wrap = vertical;
       if(vertical) {
          this.textBox.set_width(4*APPLICATION_ICON_SIZE);
          this.textBox.set_height(1.4*APPLICATION_ICON_SIZE);
          
       }
       else {
          this.textBox.set_width(-1);
          this.textBox.set_height(-1);
       }
    }
};

function FavoritesButtonExtended(appsMenuButton, app, nbFavorites) {
    this._init(appsMenuButton, app, nbFavorites);
}

FavoritesButtonExtended.prototype = {
    __proto__: CinnamonMenu.FavoritesButton.prototype,
    
    _init: function(appsMenuButton, app, nbFavorites) {
        CinnamonMenu.GenericApplicationButton.prototype._init.call(this, appsMenuButton, app);
        let monitorHeight = Main.layoutManager.primaryMonitor.height;
        let real_size = (0.7*monitorHeight) / nbFavorites;
        let icon_size = 0.6*real_size;
        if (icon_size>MAX_FAV_ICON_SIZE) icon_size = MAX_FAV_ICON_SIZE;
        this.actor.style = "padding-top: "+2+"px;padding-bottom: "+2+"px;padding-left: "+(2)+"px;padding-right: "+(2)+"px;margin:auto;";

        this.actor.add_style_class_name('menu-favorites-button');
        let icon = app.create_icon_texture(icon_size);
        this.addActor(icon);
        icon.realize()

        this._draggable = DND.makeDraggable(this.actor);     
        this.isDraggableApp = true;
    }
};

function MyApplet(orientation, panel_height, instance_id) {
   this._init(orientation, panel_height, instance_id);
}

MyApplet.prototype = {
   __proto__: CinnamonMenu.MyApplet.prototype,

   _init: function(orientation, panel_height, instance_id) {
      Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
      try {
         this.iconView = false;
         this.iconViewCount = 4;
         this.set_applet_tooltip(_("Menu"));
         this.orientation = orientation;
         this._searchIconClickedId = 0;
         this._applicationsButtons = new Array();
         this._applicationsButtonFromApp = new Object();
         this._favoritesButtons = new Array();
         this._placesButtons = new Array();
         this._transientButtons = new Array();
         this._recentButtons = new Array();
         this._categoryButtons = new Array();
         this._selectedItemIndex = null;
         this._previousTreeItemIndex = null;
         this._previousSelectedActor = null;
         this._previousVisibleIndex = null;
         this._previousTreeSelectedActor = null;
         this._activeContainer = null;
         this._activeActor = null;
         this._applicationsBoxWidth = 0;
         this.menuIsOpening = false;
         this.signalKeyPowerID = 0;
         this.showTime = false;
         this.timeFormat = "%H:%M";
         this.timeSize = 15;
         this.showDate = false;
         this.dateFormat = "%A,%e %B";
         this.dateSize = 6;

         this.RecentManager = new DocInfo.DocManager();
         this.menu = new Applet.AppletPopupMenu(this, orientation);
         this.menu.actor.add_style_class_name('menu-background');
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));

         this.menuManager = new PopupMenu.PopupMenuManager(this);
         this.menuManager.addMenu(this.menu);   
//this.on_orientation_changed(orientation);
         this.actor.connect('key-press-event', Lang.bind(this, this._onSourceKeyPress));
         this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPressEvent));
         //this._keyFocusNotifyIDSignal = global.stage.connect('notify::key-focus', Lang.bind(this, this._onKeyFocusChanged));

         this.settings = new Settings.AppletSettings(this, "configurableMenu@lestcape", instance_id);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-recent", "showRecent", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-places", "showPlaces", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-hover", "activateOnHover", this._updateActivateOnHover, null);                        
         this.settings.bindProperty(Settings.BindingDirection.IN, "menu-icon", "menuIcon", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "menu-label", "menuLabel", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "search-filesystem", "searchFilesystem", null, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "hover-delay", "hover_delay_ms", this._update_hover_delay, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "enable-autoscroll", "autoscroll_enabled", this._update_autoscroll, null);

//My Setting
         this.settings.bindProperty(Settings.BindingDirection.IN, "theme", "theme", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-view-item", "showView", this._setVisibleViewControl, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "view-item", "iconView", this._refreshApps, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "view-icon-count", "iconViewCount", this._refreshApps, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "activate-on-press", "activateOnPress", null, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-favorites", "showFavorites", this._setVisibleFavorites, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-hover-icon", "showHoverIcon", this._setVisibleHoverIcon, null);
         
         this.settings.bindProperty(Settings.BindingDirection.IN, "show-time", "showTime", this._updateClock, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "time-format", "timeFormat", this._updateClock, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "time-size", "timeSize", this._updateClock, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "show-date", "showDate", this._updateDate, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "date-format", "dateFormat", this._updateDate, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "date-size", "dateSize", this._updateDate, null);

         this.settings.bindProperty(Settings.BindingDirection.IN, "controling-height", "controlingHeight", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "height", "height", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-favorites", "scrollFavoritesVisible", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-categories", "scrollCategoriesVisible", this._updateComplete, null);
         this.settings.bindProperty(Settings.BindingDirection.IN, "scroll-applications", "scrollApplicationsVisible", this._updateComplete, null);

         this._searchInactiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                  icon_name: 'edit-find',
                                                  icon_type: St.IconType.SYMBOLIC });
         this._searchActiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                icon_name: 'edit-clear',
                                                icon_type: St.IconType.SYMBOLIC });

         this._display();
         appsys.connect('installed-changed', Lang.bind(this, this._refreshApps));
         AppFavorites.getAppFavorites().connect('changed', Lang.bind(this, this._refreshFavs));

         global.display.connect('overlay-key', Lang.bind(this, function() {
            try {
               this.menu.toggle_with_options(false);
            }
            catch(e) {
               global.logError(e);
            }
         }));
         Main.placesManager.connect('places-updated', Lang.bind(this, this._refreshPlacesAndRecent));
         this.RecentManager.connect('changed', Lang.bind(this, this._refreshPlacesAndRecent));

         this._fileFolderAccessActive = false;

         this._pathCompleter = new Gio.FilenameCompleter();
         this._pathCompleter.set_dirs_only(false);
         this.lastAcResults = new Array();

         this._updateComplete();
      }
      catch (e) {
         Main.notify("Error:", e.message);
         global.logError(e);
      }
   },
/*
    on_orientation_changed: function (orientation) {
      this.styleBackground = new St.BoxLayout();
      
/*      if(this._applet_context_menu._boxWrapper) {
         this._applet_context_menu._boxPointer.bin.remove_child(this._applet_context_menu._boxWrapper);
         this.styleBackground.add(this._applet_context_menu._boxWrapper);
      }
      this._applet_context_menu.actor = this.styleBackground.actor;//this._boxPointer.actor;*/
/*
        this.menu.destroy();
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        
        this.menu.actor.add_style_class_name('menu-background');
        this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
        this.menu._boxPointer.bin.remove_child(this.menu._boxWrapper);
       // this.styleBackground.add_actor(this.menu._boxWrapper);
        this.menu.actor = this.styleBackground;
        this.menuManager.addMenu(this.menu);
        this._display();
   },
*/
   _onMenuKeyPress: function(actor, event) {
      try {
        let symbol = event.get_key_symbol();
        let item_actor;
        this.appBoxIter.reloadVisible();
        this.catBoxIter.reloadVisible();

        let keyCode = event.get_key_code();
        let modifierState = Cinnamon.get_event_state(event);

        /* check for a keybinding and quit early, otherwise we get a double hit
           of the keybinding callback */
        let action = global.display.get_keybinding_action(keyCode, modifierState);

        if (action == Meta.KeyBindingAction.CUSTOM) {
            return true;
        }

        if (global.display.get_is_overlay_key(keyCode, modifierState) && this.menu.isOpen) {
            this.menu.close();
            return true;
        }   

        if(actor._delegate instanceof CinnamonMenu.FavoritesButton) {
           this._navegateFavBox(symbol, actor);
           return false;
        } else if(actor == this.powerButtons) {
           this._navegateSysBox(symbol, actor);
           return false; 
        } else if(actor == this.hover.actor) {
           this._navegateHoverIcon(symbol, actor);
           return false;
        } else if(actor == this.hover.menu.actor) {
           this._navegateHoverMenu(symbol, actor);
           return false;
        } else if(this._activeContainer === null) {
           item_actor = this._navegationInit(symbol);
        } else if(this._activeContainer == this.applicationsBox) {
           if(this.iconView) item_actor = this._navegateAppBoxIcon(symbol, this._selectedItemIndex, this._selectedColumnIndex);
           else item_actor = this._navegateAppBox(symbol, this._selectedItemIndex);
        } else if(this._activeContainer == this.categoriesBox) {
           item_actor = this._navegateCatBox(symbol, this._selectedItemIndex);
        } else if (this.searchFilesystem && (this._fileFolderAccessActive || symbol == Clutter.slash)) {
           return this._searchFileSystem(symbol);
        }
        else {
            return false;
        }
        if(!item_actor || item_actor === this.searchEntry) {
            return false;
        }
        if(item_actor._delegate)
           item_actor._delegate.emit('enter-event');
        return true;
      }
      catch(e) {
        Main.notify("Error", e.message);
      }
   },

   _searchFileSystem: function(symbol) {
      if(symbol == Clutter.Return || symbol == Clutter.KP_Enter) {
         if(this._run(this.searchEntry.get_text())) {
            this.menu.close();
         }
         return true;
      }
      else if(symbol == Clutter.slash) {
         // Need preload data before get completion. GFilenameCompleter load content of parent directory.
         // Parent directory for /usr/include/ is /usr/. So need to add fake name('a').
         let text = this.searchEntry.get_text().concat('/a');
         let prefix;
         if(text.lastIndexOf(' ') == -1)
            prefix = text;
         else
            prefix = text.substr(text.lastIndexOf(' ') + 1);
         this._getCompletion(prefix);

         return false;
      }
      else if(symbol == Clutter.Tab) {
         let text = actor.get_text();
         let prefix;
         if(text.lastIndexOf(' ') == -1)
            prefix = text;
         else
            prefix = text.substr(text.lastIndexOf(' ') + 1);
         let postfix = this._getCompletion(prefix);
         if(postfix != null && postfix.length > 0) {
            actor.insert_text(postfix, -1);
            actor.set_cursor_position(text.length + postfix.length);
            if(postfix[postfix.length - 1] == '/')
               this._getCompletion(text + postfix + 'a');
         }
         return true;
      }
      else if(symbol == Clutter.Escape) {
         this.searchEntry.set_text('');
         this._fileFolderAccessActive = false;
      }
      return false;
   },

   _navegationInit: function(symbol) {
      let item_actor;
      if(symbol == Clutter.Tab) {
         if(this.showHoverIcon)
            this.fav_actor = this.hover.actor;
         else
            this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      } else if(symbol == Clutter.KEY_Up) {
         this._activeContainer = this.applicationsBox;
         item_actor = this.appBoxIter.getLastVisible();
      } else if (symbol == Clutter.KEY_Down) {
         this._activeContainer = this.applicationsBox;
         item_actor = this.appBoxIter.getFirstVisible();
      }
     
      //global.stage.set_key_focus(this.powerButtons);
      this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
      this._selectedColumnIndex = this.appBoxIter.getInternalIndexOfChild(item_actor);
      return item_actor;
   },

   _navegateAppBox: function(symbol, index) {
      let item_actor;
      if(symbol == Clutter.Tab) {
         if(this.showHoverIcon)
            this.fav_actor = this.hover.actor;
         else
            this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if(symbol == Clutter.KEY_Up) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
         item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      } 
      else if(symbol == Clutter.KEY_Down) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
         item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Left) {//&& !this.searchActive
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
         item_actor = (this._previousTreeSelectedActor != null) ? this._previousTreeSelectedActor : this.catBoxIter.getFirstVisible();
         index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._previousTreeSelectedActor = item_actor;
      } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         item_actor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
         item_actor._delegate.activate();
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateAppBoxIcon: function(symbol, index, columnIndex) {
      let item_actor;
      if(symbol == Clutter.Tab) {
         if(this.showHoverIcon)
            this.fav_actor = this.hover.actor;
         else
            this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if(symbol == Clutter.KEY_Up) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*columnIndex);
         item_actor = this.appBoxIter.getUpperVisible(this._previousSelectedActor);//getPrevVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      } 
      else if(symbol == Clutter.KEY_Down) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*columnIndex);
         item_actor = this.appBoxIter.getDownVisible(this._previousSelectedActor);//getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Right) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*columnIndex);
         item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButton(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Left) {//&& !this.searchActive
         if(columnIndex == 0) {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
            item_actor = (this._previousTreeSelectedActor != null) ? this._previousTreeSelectedActor : this.catBoxIter.getFirstVisible();
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor = item_actor;
         } else {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*columnIndex);
            item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
            index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._scrollToButton(item_actor._delegate);
         }
      } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         item_actor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
         item_actor._delegate.activate();
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateCatBox: function(symbol, index) {
      let item_actor;
      if(symbol == Clutter.Tab) {
         if(this.showHoverIcon)
            this.fav_actor = this.hover.actor;
         else
            this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if(symbol == Clutter.KEY_Up) {
         this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
         this._previousTreeSelectedActor._delegate.isHovered = false;
         item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
         index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._scrollToButtonCategories(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Down) {
         this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(index);
         this._previousTreeSelectedActor._delegate.isHovered = false;
         item_actor = this.catBoxIter.getNextVisible(this._activeActor)
         index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._previousTreeSelectedActor._delegate.emit('leave-event');
         this._scrollToButtonCategories(item_actor._delegate);
      }
      else if(symbol == Clutter.KEY_Right) {// && (this._activeContainer !== this.applicationsBox)
         if(this._previousVisibleIndex !== null) {
            item_actor = this.appBoxIter.getVisibleItem(this._previousVisibleIndex);
         } else {
            item_actor = this.appBoxIter.getFirstVisible();
         }
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateFavBox: function(symbol, actor) {
      this.fav_actor = actor;
      let childrens = this.favoritesBox.get_children()[0].get_children();
      if(childrens.length > 0) {
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Right)) {
            if(childrens[0] == actor) {
               this.fav_actor = childrens[childrens.length -1];
            } else
               this.fav_actor = childrens[childrens.indexOf(actor) - 1];
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            this._scrollToButtonFav(this.fav_actor._delegate);
            return false;
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Left)) {
            if(childrens[childrens.length - 1] == actor) {
               this.fav_actor = childrens[0];
            } else
               this.fav_actor = childrens[childrens.indexOf(actor) + 1];
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            this._scrollToButtonFav(this.fav_actor._delegate);
            return false;
         }
         else if(symbol == Clutter.Tab) {
            this.fav_actor = this.searchEntry;
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
         } else {
            global.stage.set_key_focus(this.powerButtons);
         }
         return false;
      }
   },

   _navegateSysBox: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         let childrens = this.favoritesBox.get_children()[0].get_children();
         if((this.showFavorites)&&(childrens.length > 0))
            this.fav_actor = childrens[0];
         else
            this.fav_actor = this.searchEntry;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         if(this.sysButtSelected - 1 < 0)
            this.sysButtSelected = this._systemButtons.length -1;
         else
            this.sysButtSelected--;
         this._systemButtons[this.sysButtSelected].setActive(true);
         this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
         this._systemButtons[this.sysButtSelected].setActive(false);
         if(this.sysButtSelected + 1 < this._systemButtons.length)
            this.sysButtSelected++;
         else
            this.sysButtSelected = 0;
         this._systemButtons[this.sysButtSelected].setActive(true);
         this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         if(this.sysButtSelected) {
            this._systemButtons[this.sysButtSelected].setActive(false);
            this._systemButtons[this.sysButtSelected].executeAction();
         }
      }
   },

   _navegateHoverIcon: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this.powerButtons;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
   },

   _navegateHoverMenu: function(symbol, actor) {
      if((this.hover.account.active)&&(symbol == Clutter.KEY_Down)) {
         this.fav_actor = this.hover.notificationsSwitch.actor;
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
   },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
   },

   _scrollToButton: function(button) {
        var current_scroll_value = this.applicationsScrollBox.get_vscroll_bar().get_adjustment().get_value();
        var box_height = this.applicationsScrollBox.get_allocation_box().y2-this.applicationsScrollBox.get_allocation_box().y1;
        var new_scroll_value = current_scroll_value;
        var alloc_box = button.actor.get_parent().get_allocation_box();
        if (current_scroll_value > alloc_box.y1-10) new_scroll_value = alloc_box.y1-10;
        if (box_height+current_scroll_value < alloc_box.y2+10) new_scroll_value = alloc_box.y2-box_height+10;
        if (new_scroll_value!=current_scroll_value) this.applicationsScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
    },

   _scrollToButtonFav: function(button) {
      var current_scroll_value = this.favoritesScrollBox.get_vscroll_bar().get_adjustment().get_value();
      var box_height = this.favoritesScrollBox.get_allocation_box().y2-this.favoritesScrollBox.get_allocation_box().y1;
      var new_scroll_value = current_scroll_value;
      if (current_scroll_value > button.actor.get_allocation_box().y1-10) new_scroll_value = button.actor.get_allocation_box().y1-10;
      if (box_height+current_scroll_value < button.actor.get_allocation_box().y2+10) new_scroll_value = button.actor.get_allocation_box().y2-box_height+10;
      if (new_scroll_value!=current_scroll_value) this.favoritesScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
   },

   _scrollToButtonCategories: function(button) {
      var current_scroll_value = this.categoriesScrollBox.get_vscroll_bar().get_adjustment().get_value();
      var box_height = this.categoriesScrollBox.get_allocation_box().y2-this.categoriesScrollBox.get_allocation_box().y1;
      var new_scroll_value = current_scroll_value;
      if (current_scroll_value > button.actor.get_allocation_box().y1-10) new_scroll_value = button.actor.get_allocation_box().y1-10;
      if (box_height+current_scroll_value < button.actor.get_allocation_box().y2+10) new_scroll_value = button.actor.get_allocation_box().y2-box_height+10;
      if (new_scroll_value!=current_scroll_value) this.categoriesScrollBox.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
   },

   _updateView: function() {
      try {
      let viewBox;
      if(this.iconView) {
         let appBox = this.applicationsBox.get_children();
         let appItem;
         for(let i = 0; i < appBox.length; i++) {
            appItem = appBox[i].get_children();
            if(appItem) {
               for(let j = 0; j < appItem.length; j++)
                  appBox[i].remove_actor(appItem[j]);
            }
         }
//app
         let visibleAppButtons = new Array();
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(this._applicationsButtons[i].actor.visible) {
               this._applicationsButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._applicationsButtons[i]);
            }
         }
         let valance = Math.floor(visibleAppButtons.length/this.iconViewCount);
         if(valance * 4 < visibleAppButtons.length)
            valance++;
         let currValue;
         for(let i = 0; i < valance; i++) {
            viewBox = new St.BoxLayout({ vertical: false });
            for(let j = 0; j < this.iconViewCount; j++) {
               currValue = (i*(this.iconViewCount) + j);
               if(currValue < visibleAppButtons.length) {
                  viewBox.add_actor(visibleAppButtons[currValue].actor);
                  viewBox.add_actor(visibleAppButtons[currValue].menu.actor);
               }
            }
            this.applicationsBox.add_actor(viewBox);
         }
//place
         visibleAppButtons = new Array();
         for(let i = 0; i < this._placesButtons.length; i++) {
            if(this._placesButtons[i].actor.visible) {
               this._placesButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._placesButtons[i]);
            }
         }
         valance = Math.floor(visibleAppButtons.length/this.iconViewCount);
         if(valance * 4 < visibleAppButtons.length)
            valance++;
         for(let i = 0; i < valance; i++) {
            viewBox = new St.BoxLayout({ vertical: false });
            for(let j = 0; j < this.iconViewCount; j++) {
               currValue = (i*(this.iconViewCount) + j);
               if(currValue < visibleAppButtons.length) {
                  viewBox.add_actor(visibleAppButtons[currValue].actor);
               }
            }
            this.applicationsBox.add_actor(viewBox);
         }
//recent
         visibleAppButtons = new Array();
         for(let i = 0; i < this._recentButtons.length; i++) {
            if(this._recentButtons[i].actor.visible) {
               this._recentButtons[i].setVertical(this.iconView);
               visibleAppButtons.push(this._recentButtons[i]);
            }
         }
         valance = Math.floor(visibleAppButtons.length/this.iconViewCount);
         if(valance * 4 < visibleAppButtons.length)
            valance++;
         for(let i = 0; i < valance; i++) {
            viewBox = new St.BoxLayout({ vertical: false });
            for(let j = 0; j < this.iconViewCount; j++) {
               currValue = (i*(this.iconViewCount) + j);
               if(currValue < visibleAppButtons.length) {
                  viewBox.add_actor(visibleAppButtons[currValue].actor);
               }
            }
            this.applicationsBox.add_actor(viewBox);
         }
//transient      
         for(let i = 0; i < this._transientButtons.length; i ++) {
            if(this._transientButtons[i].actor.visible) {
               viewBox = new St.BoxLayout({ vertical: false});
               viewBox.add_actor(this._transientButtons[i].actor);
               this.applicationsBox.add_actor(viewBox);
            }
         }
         this.applicationsBox.set_width(this.iconViewCount*this._applicationsBoxWidth + 42);
      } else {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            this._applicationsButtons[i].setVertical(this.iconView);
            viewBox = new St.BoxLayout({ vertical: true});
            viewBox.add_actor(this._applicationsButtons[i].actor);
            viewBox.add_actor(this._applicationsButtons[i].menu.actor);
            this.applicationsBox.add_actor(viewBox);
         }
         for(let i = 0; i < this._placesButtons.length; i ++) {
            viewBox = new St.BoxLayout({ vertical: true});
            viewBox.add_actor(this._placesButtons[i].actor);
            this.applicationsBox.add_actor(viewBox);
         }
         for(let i = 0; i < this._recentButtons.length; i ++) {
            viewBox = new St.BoxLayout({ vertical: true});
            viewBox.add_actor(this._recentButtons[i].actor);
            this.applicationsBox.add_actor(viewBox);
         }
         this.applicationsBox.set_width(this._applicationsBoxWidth + 42);
      }
      } catch(e) {
        Main.notify("Error", e.message);
      }
   },

   _update_autoscroll: function() {
      this.applicationsScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
   },    

   _setVisibleViewControl: function() {
      this.bttViewGrid.visible = this.showView;
      this.bttViewList.visible = this.showView;
   },

   _setVisibleFavorites: function() {
      this.favBoxWrapper.remove_actor(this.favoritesScrollBox);
      if(this.showFavorites) {
         this.favBoxWrapper.insert_actor(this.favoritesScrollBox, 0);
         this._refreshFavs();
      }
   },

   _setVisibleHoverIcon: function() {
      let currentFather;
      switch(this.theme) {
         case "classic":
            currentFather = this.searchBox;
            break;
         case "stylized":
            currentFather = this.searchBox;
            break;
      }
      if(currentFather) {
         currentFather.remove_actor(this.hover.actor);
         if(this.showHoverIcon)
            currentFather.add(this.hover.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });
      }
   },

   _updateClock: function() {
      this.timeDate.setClockVisible(this.showTime);
      this.timeDate.setTimeFormat(this.timeFormat);
      this.timeDate.setTimeSize(this.timeSize);
   },

   _updateDate: function() {
      this.timeDate.setDateVisible(this.showDate);
      this.timeDate.setDateFormat(this.dateFormat);
      this.timeDate.setDateSize(this.dateSize);
   },

   _updateComplete: function() {
      this._updateMenuSection();
      this._display();
      this._setVisibleViewControl();
      this._setVisibleFavorites();
      this._setVisibleHoverIcon();
      this._updateClock();
      this._updateDate();
      this._update_autoscroll();
      this._refreshPlacesAndRecent();
      this._updateActivateOnHover();
      this._updateIconAndLabel();
      this._update_hover_delay();
   },

   _updateHeight: function() {
      if(this.controlingHeight) {
         let oldHeight = this.betterPanel.get_height();
         this.betterPanel.set_height(this.height);
         if(this.scrollFavoritesVisible)
            this.favBoxWrapper.set_height(-1);
         else
            this.favoritesBox.set_height(this.height - this._internalHeight(this.favBoxWrapper) + this.favoritesBox.get_height() + this.searchBox.get_height());
         if(this.scrollCategoriesVisible)
            this.categoriesBox.set_height(-1);
         else
            this.categoriesBox.set_height(this.height);
         if(this.scrollApplicationsVisible)
            this.applicationsBox.set_height(-1);
         else
            this.applicationsBox.set_height(this.height);
      }
      else {
         this.favBoxWrapper.set_height(-1);
         this.categoriesBox.set_height(-1);
         this.applicationsBox.set_height(-1);
         this.betterPanel.set_height(-1);
      }
   },

   _internalHeight: function(pane) {
      let actors = pane.get_children();
      let result = 0;
      for(var i=0; i<actors.length; i++) {
         result += actors[i].get_height();
      }
      return result;
   },

   _onButtonReleaseEvent: function(actor, event) {
      if(!this.activateOnPress)
         CinnamonMenu.MyApplet.prototype._onButtonReleaseEvent.call(this, actor, event);
   },

   _onButtonPressEvent: function(actor, event) {
      if((this.activateOnPress)&&(!global.settings.get_boolean("panel-edit-mode")))
         CinnamonMenu.MyApplet.prototype._onButtonReleaseEvent.call(this, actor, event);
   },

   _updateMenuSection: function() {
      if(this.menu) {
         this.menu.close();
         this.menu.destroy();
         this.menu = new Applet.AppletPopupMenu(this, this.orientation);
         this.menuManager.addMenu(this.menu);
        
         this.menu.actor.add_style_class_name('menu-background');
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
      }
   },

   _createVerticalScroll: function() {
      let scrollBox = new St.ScrollView({ x_fill: true, y_fill: false, y_align: St.Align.START, style_class: 'vfade menu-applications-scrollbox' });
      scrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
      let vscroll = scrollBox.get_vscroll_bar();
      vscroll.connect('scroll-start',
                       Lang.bind(this, function() {
                          this.menu.passEvents = true;
                       }));
      vscroll.connect('scroll-stop',
                       Lang.bind(this, function() {
                          this.menu.passEvents = false;
                       }));
      return scrollBox;
   },

   _createSymbolicButton: function(icon) {
      let bttIcon = new St.Icon({icon_name: icon, icon_type: St.IconType.SYMBOLIC,
	                         style_class: 'popup-menu-icon', icon_size: MAX_FAV_ICON_SIZE});
      let btt = new St.Button({ child: bttIcon });
      this.controlView.add(btt, { x_fill: false, expand: false });
   
      btt.connect('notify::hover', Lang.bind(this, function(actor) {
         if(actor.get_hover()) {
            global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
            actor.set_style_class_name('menu-category-button-selected');
         }
         else {
            global.unset_cursor();
            actor.set_style_class_name('menu-category-button');
         }
      }));
      btt.set_style_class_name('menu-category-button');
      btt.set_style('padding: 0px;');
      return btt;
   },

   _display: function() {
      try {
         this._activeContainer = null;
         this._activeActor = null;
         this.vectorBox = null;
         this.actor_motion_id = 0;
         this.vector_update_loop = null;
         this.current_motion_actor = null;
         let section = new PopupMenu.PopupMenuSection();
         this.menu.addMenuItem(section);     

         this._session = new GnomeSession.SessionManager();
         this._screenSaverProxy = new ScreenSaver.ScreenSaverProxy();

         this.rightPane = new St.BoxLayout({ vertical: true });        
//search
         this.searchBox = new St.BoxLayout({ vertical: false });//{ style_class: 'menu-search-box' });
         this.controlBox = new St.BoxLayout({ vertical: true });
         this.rightPane.add_actor(this.searchBox);

         this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                           hint_text: _("Type to search..."),
                                           track_hover: true,
                                           can_focus: true });
         this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

         this.searchBox.add(this.controlBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
         this.searchActive = false;
         this.searchEntryText = this.searchEntry.clutter_text;
         this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
         this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this._previousSearchPattern = "";

//view
         this.controlView = new St.BoxLayout({ vertical: false });
         this.bttViewList = this._createSymbolicButton('view-list-symbolic');
         this.bttViewList.connect('clicked', Lang.bind(this, function() {
            this.bttViewGrid.set_style('padding: 0px;');
            this.bttViewList.set_style('padding: 0px; border: 1px solid #ffffff;');
            this.iconView = false;
            this._refreshApps();
         }));
         this.controlView.add(this.bttViewList, { x_fill: false, expand: false });
         this.bttViewGrid = this._createSymbolicButton('view-grid-symbolic');
         this.bttViewGrid.connect('clicked', Lang.bind(this, function() {
            this.bttViewList.set_style('padding: 0px;');
            this.bttViewGrid.set_style('padding: 0px; border: 1px solid #ffffff;');
            this.iconView = true;
            this._refreshApps();
         }));
         this.controlView.add(this.bttViewGrid, { x_fill: false, expand: false });
         if(this.iconView)
            this.bttViewGrid.set_style('padding: 0px; border: 1px solid #ffffff;');
         else
            this.bttViewList.set_style('padding: 0px; border: 1px solid #ffffff;');
         this.timeDate = new TimeAndDate();
         this.controlView.add(this.timeDate.actor, {x_fill: false, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: true});
//view
         this.controlBox.add(this.controlView, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
         this.controlBox.add(this.searchEntry, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
//search

         this.hover = new HoverIcon(this);
         this.hover.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this.hover.menu.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));

         this.searchBox.add(this.hover.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });
         this.searchBox.add(this.hover.menu.actor, {x_fill: false, x_align: St.Align.MIDDLE, expand: true });

         this.categoriesApplicationsBox = new CinnamonMenu.CategoriesApplicationsBox();
         this.rightPane.add_actor(this.categoriesApplicationsBox.actor);

         this.favoritesScrollBox = this._createVerticalScroll();
         this.categoriesScrollBox = this._createVerticalScroll();
         this.applicationsScrollBox = this._createVerticalScroll();
         this._update_autoscroll();

         this.categoriesBox = new St.BoxLayout({ style_class: 'menu-categories-box', vertical: true });
         this.applicationsBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:true });
         this.favBoxWrapper = new St.BoxLayout({ vertical: true });
         this.favoritesBox = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: true });

         this.a11y_settings = new Gio.Settings({ schema: "org.cinnamon.desktop.a11y.applications" });
         this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
         this._updateVFade();

         this.favoritesScrollBox.add_actor(this.favoritesBox);
         this.favBoxWrapper.add_actor(this.favoritesScrollBox);

         this.categoriesScrollBox.add_actor(this.categoriesBox);
         this.applicationsScrollBox.add_actor(this.applicationsBox);

         this.betterPanel = new St.BoxLayout({ vertical: false });

         //this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
         this.betterPanel.add(this.categoriesScrollBox, { x_fill: false, expand: false });
         this.betterPanel.add(this.applicationsScrollBox, { x_fill: false, expand: false });

         this.categoriesApplicationsBox.actor.add_actor(this.betterPanel);
                                                          
         this.mainBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical:false });

         this.appBoxIter = new VisibleChildIteratorExtended(this, this.applicationsBox, this.iconViewCount);
         this.applicationsBox._vis_iter = this.appBoxIter;
         this.catBoxIter = new VisibleChildIteratorExtended(this, this.categoriesBox, 1);
         this.categoriesBox._vis_iter = this.catBoxIter;

         this._refreshApps();

         this.endBox = new St.BoxLayout({ vertical: false });
         this.selectedAppBox = new St.BoxLayout({ style_class: 'menu-selected-app-box', vertical: true });
         this.selectedAppTitle = new St.Label({ style_class: 'menu-selected-app-title', text: "" });
         this.selectedAppBox.add(this.selectedAppTitle);
         this.selectedAppDescription = new St.Label({ style_class: 'menu-selected-app-description', text: "" });
         this.selectedAppBox.add_actor(this.selectedAppDescription);
         
         this.endBox.add(this.selectedAppBox, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
         this.endBox.set_style("padding-right: 20px;");
         this.signalKeyPowerID = 0;

         switch(this.theme) {
            case "classic":
                          this.loadClassic(); 
                          break;
            case "stylized":
                          this.loadStylized(); 
                          break;
            default:
                          this.loadClassic(); 
                          break;
         }

         section.actor.add_actor(this.mainBox);
         section.actor.add_actor(this.endBox);

         Mainloop.idle_add(Lang.bind(this, function() {
            this._updateHeight();//Add by me
            this._clearAllSelections(true);
         }));
      } catch(e) {
         Main.notify("Error:", e.message);
      }
   },

   loadClassic: function() {
      this.powerButtons = this._powerButtons(true);
      this.favBoxWrapper.add(this.powerButtons, { y_align: St.Align.END, y_fill: false, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.END, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
   },

   loadStylized: function() {
      this.powerButtons = this._powerButtons(false);
      this.endBox.add(this.powerButtons, { x_fill: false, x_align: St.Align.END, expand: false });
      this.mainBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.mainBox.add(this.rightPane, { span: 2, x_fill: false, expand: false });
   },

   _clearAllSelections: function(hide_apps) {
       for(let i = 0; i < this._applicationsButtons.length; i++) {
          this._applicationsButtons[i].actor.style_class = "menu-application-button";
          if(hide_apps) {
             this._applicationsButtons[i].actor.hide();
          }
       }
       let actors = this.categoriesBox.get_children();
       for(let i = 0; i < actors.length; i++){
          let actor = actors[i];
          actor.style_class = "menu-category-button";
          actor.show();
       }
    },

   _select_category: function(dir, categoryButton) {
      if(dir)
         this._displayButtons(this._listApplications(dir.get_menu_id()));
      else
         this._displayButtons(this._listApplications(null));
      this.closeApplicationsContextMenus(null, false);
   },

   _displayButtons: function(appCategory, places, recent, apps, autocompletes) {
      if(appCategory) {
         if(appCategory == "all") {
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(!this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = true;//.show();
               }
            }
         } else {
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(this._applicationsButtons[i].category.indexOf(appCategory) != -1) {
                  if(!this._applicationsButtons[i].actor.visible) {
                     this._applicationsButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._applicationsButtons[i].actor.visible) {
                     this._applicationsButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else if(apps) {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(apps.indexOf(this._applicationsButtons[i].name) != -1) {
               if(!this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = true;//.show();
               }
            } else {
               if(this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = false;//.hide();
               }
            }
         }
      } else {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(this._applicationsButtons[i].actor.visible) {
               this._applicationsButtons[i].actor.visible = false;//.hide();
            }
         }
      }
      if(places) {
         if(places == -1) {
            for(let i = 0; i < this._placesButtons.length; i++) {
               this._placesButtons[i].actor.visible = true;//.show();
            }
         } else {
            for(let i = 0; i < this._placesButtons.length; i++) {
               if(places.indexOf(this._placesButtons[i].button_name) != -1) {
                  if(!this._placesButtons[i].actor.visible) {
                     this._placesButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._placesButtons[i].actor.visible) {
                     this._placesButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else {
         for(let i = 0; i < this._placesButtons.length; i++) {
            if(this._placesButtons[i].actor.visible) {
               this._placesButtons[i].actor.visible = false;//.hide();
            }
         }
      }
      if(recent) {
         if(recent == -1) {
            for(let i = 0; i < this._recentButtons.length; i++) {
               if(!this._recentButtons[i].actor.visible) {
                  this._recentButtons[i].actor.visible = true;//.show();
               }
            }
         } else {
            for(let i = 0; i < this._recentButtons.length; i++) {
               if(recent.indexOf(this._recentButtons[i].button_name) != -1) {
                  if(!this._recentButtons[i].actor.visible) {
                     this._recentButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._recentButtons[i].actor.visible) {
                     this._recentButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else {
         for(let i = 0; i < this._recentButtons.length; i++) {
            if(this._recentButtons[i].actor.visible) {
               this._recentButtons[i].actor.visible = false;//.hide();
            }
         }
      }

      if(autocompletes) {
         for(let i = 0; i < autocompletes.length; i++) {
            let button = new TransientButton(this, autocompletes[i]);
            button.actor.connect('realize', Lang.bind(this, this._onApplicationButtonRealized));
            button.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, button));
            this._addEnterEvent(button, Lang.bind(this, this._appEnterEvent, button));
            this._transientButtons.push(button);
            button.actor.realize();
         }
      }
      this._updateView();
   },

   _onApplicationButtonRealized: function(actor) {
      if(this.iconView) {
         this._applicationsBoxWidth = actor.get_width();
         this.applicationsBox.set_width(this.iconViewCount*this._applicationsBoxWidth + 42); // The answer to life...
      }
      else {
         if(actor.get_width() > this._applicationsBoxWidth) {
            this._applicationsBoxWidth = actor.get_width();
            this.applicationsBox.set_width(this._applicationsBoxWidth + 42); // The answer to life...
         }
      }
   },

   _refreshFavs: function() {
      //Remove all favorites
      this.favoritesBox.get_children().forEach(Lang.bind(this, function (child) {
          child.destroy();
      }));

      let favoritesBox = new CinnamonMenu.FavoritesBox();
      this.favoritesBox.add_actor(favoritesBox.actor);
         
      //Load favorites again
      this._favoritesButtons = new Array();
      let launchers = global.settings.get_strv('favorite-apps');
      let appSys = Cinnamon.AppSystem.get_default();
      let j = 0;
      for(let i = 0; i < launchers.length; ++i) {
         let app = appSys.lookup_app(launchers[i]);
         if(app) {
            let button = new FavoritesButtonExtended(this, app, launchers.length); // + 3 because we're adding 3 system buttons at the bottom
            button.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(4)+"px;padding-right: "+(-5)+"px;margin:auto;";
            this._favoritesButtons[app] = button;
            favoritesBox.actor.add(button.actor, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            button.actor.connect('enter-event', Lang.bind(this, function() {
               this._clearPrevCatSelection();
               this.selectedAppTitle.set_text(button.app.get_name());
               this.hover.refreshApp(button.app);
               if(button.app.get_description()) this.selectedAppDescription.set_text(button.app.get_description().split("\n")[0]);
                  else this.selectedAppDescription.set_text("");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
               this.hover.refreshFace();
            }));
            button.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            ++j;
         }
      }
   },

   _refreshApps : function() {
      this.applicationsBox.destroy_all_children();
      this._applicationsButtons = new Array();
      this._transientButtons = new Array();
      this._applicationsButtonFromApp = new Object(); 
      this._applicationsBoxWidth = 0;
      //Remove all categories
      this.categoriesBox.destroy_all_children();

      this._allAppsCategoryButton = new CinnamonMenu.CategoryButton(null);
      this._addEnterEvent(this._allAppsCategoryButton, Lang.bind(this, function() {
         if(!this.searchActive) {
            this._allAppsCategoryButton.isHovered = true;
            if(this.hover_delay > 0) {
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this._allAppsCategoryButton.isHovered) {
                        this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
                        this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
                        this._select_category(null, this._allAppsCategoryButton);
                     } else {
                        this._allAppsCategoryButton.actor.style_class = "menu-category-button";
                     }
                  }
               });
            } else {
               this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
               this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
               this._select_category(null, this._allAppsCategoryButton);
            }
            this.makeVectorBox(this._allAppsCategoryButton.actor);
         }
      }));
      this._allAppsCategoryButton.actor.connect('leave-event', Lang.bind(this, function () {
         this._previousSelectedActor = this._allAppsCategoryButton.actor;
         this._allAppsCategoryButton.isHovered = false;
      }));
      this.categoriesBox.add_actor(this._allAppsCategoryButton.actor);

      let trees = [appsys.get_tree()];

      for(var i in trees) {
         let tree = trees[i];
         let root = tree.get_root_directory();
            
         let iter = root.iter();
         let nextType;
         while((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
            if(nextType == GMenu.TreeItemType.DIRECTORY) {
               let dir = iter.get_directory();
               if(dir.get_is_nodisplay())
                  continue;
               if(this._loadCategory(dir)) {
                  let categoryButton = new CinnamonMenu.CategoryButton(dir);
                  this._addEnterEvent(categoryButton, Lang.bind(this, function() {
                     if(!this.searchActive) {
                        categoryButton.isHovered = true;
                        if(this.hover_delay > 0) {
                           Tweener.addTween(this, {
                              time: this.hover_delay, onComplete: function () {
                                 if(categoryButton.isHovered) {
                                    this._clearPrevCatSelection(categoryButton.actor);
                                    categoryButton.actor.style_class = "menu-category-button-selected";
                                    this._select_category(dir, categoryButton);
                                 } else {
                                    categoryButton.actor.style_class = "menu-category-button";
                                 }
                              }
                           });
                        } else {
                           this._clearPrevCatSelection(categoryButton.actor);
                           categoryButton.actor.style_class = "menu-category-button-selected";
                           this._select_category(dir, categoryButton);
                        }
                        this.makeVectorBox(categoryButton.actor);
                     }
                  }));
                  categoryButton.actor.connect('leave-event', Lang.bind(this, function () {
                     if(this._previousTreeSelectedActor === null) {
                        this._previousTreeSelectedActor = categoryButton.actor;
                     } else {
                        let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                        let nextIdx = this.catBoxIter.getVisibleIndex(categoryButton.actor);
                        if(Math.abs(prevIdx - nextIdx) <= 1) {
                           this._previousTreeSelectedActor = categoryButton.actor;
                        }
                     }
                     categoryButton.isHovered = false;
                  }));
                  this.categoriesBox.add_actor(categoryButton.actor);
               }
            }
         } 
      }
      // Sort apps and add to applicationsBox
      this._applicationsButtons.sort(function(a, b) {
         let sr = a.app.get_name().toLowerCase() > b.app.get_name().toLowerCase();
         return sr;
      });
       
      this._refreshPlacesAndRecent();

      this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
      this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
      this._select_category(null, this._allAppsCategoryButton);
      this.appBoxIter.setNumberView(this.iconViewCount);
   },

   _refreshPlacesAndRecent : function() {
      for(let i = 0; i < this._placesButtons.length; i ++) {
         this._placesButtons[i].actor.destroy();
      }
      for(let i = 0; i < this._recentButtons.length; i ++) {
         this._recentButtons[i].actor.destroy();
      }
      for(let i = 0; i < this._categoryButtons.length; i++) {
         if(this._categoryButtons[i] instanceof CinnamonMenu.PlaceCategoryButton ||
            this._categoryButtons[i] instanceof CinnamonMenu.RecentCategoryButton) {
            this._categoryButtons[i].actor.destroy();
         }
      }
      this._placesButtons = new Array();
      this._recentButtons = new Array();

      // Now generate Places category and places buttons and add to the list
      if(this.showPlaces) {
         this.placesButton = new CinnamonMenu.PlaceCategoryButton();
         this._addEnterEvent(this.placesButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.placesButton.isHovered = true;
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this.placesButton.isHovered) {
                        this._clearPrevCatSelection(this.placesButton);
                        this.placesButton.actor.style_class = "menu-category-button-selected";
                        this._displayButtons(null, -1);
                     }
                  }
               });
               this.makeVectorBox(this.placesButton.actor);
            }
         }));
         this.placesButton.actor.connect('leave-event', Lang.bind(this, function () {
            if(this._previousTreeSelectedActor === null) {
               this._previousTreeSelectedActor = this.placesButton.actor;
            } else {
               let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
               let nextIdx = this.catBoxIter.getVisibleIndex(this.placesButton.actor);
               let idxDiff = Math.abs(prevIdx - nextIdx);
               let numVisible = this.catBoxIter.getNumVisibleChildren();
               if(idxDiff <= 1 || Math.min(prevIdx, nextIdx) < 0) {
                  this._previousTreeSelectedActor = this.placesButton.actor;
               }
            }

            this.placesButton.isHovered = false;
         }));
         this._categoryButtons.push(this.placesButton);
         this.categoriesBox.add_actor(this.placesButton.actor);

         let bookmarks = this._listBookmarks();
         let devices = this._listDevices();
         let places = bookmarks.concat(devices);
         for(let i = 0; i < places.length; i++) {
            let place = places[i];
            let button = new PlaceButtonExtended(this, place, place.name);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppTitle.set_text("");
               this.hover.refreshPlace(button.place);
               this.selectedAppDescription.set_text(button.place.id.slice(16));
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this._previousSelectedActor = button.actor;
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
               this.hover.refreshFace();
            }));
            this._placesButtons.push(button);
         }
      }
      // Now generate recent category and recent files buttons and add to the list
      if(this.showRecent) {
         this.recentButton = new CinnamonMenu.RecentCategoryButton();
         this._addEnterEvent(this.recentButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.recentButton.isHovered = true;
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this.recentButton.isHovered) {
                        this._clearPrevCatSelection(this.recentButton.actor);
                        this.recentButton.actor.style_class = "menu-category-button-selected";
                        this._displayButtons(null, null, -1);
                     }
                  }
               });
               this.makeVectorBox(this.recentButton.actor);
            }
         }));
         this.recentButton.actor.connect('leave-event', Lang.bind(this, function () {  
            if(this._previousTreeSelectedActor === null) {
               this._previousTreeSelectedActor = this.recentButton.actor;
            } else {
               let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
               let nextIdx = this.catBoxIter.getVisibleIndex(this.recentButton.actor);
               let numVisible = this.catBoxIter.getNumVisibleChildren();
                    
               if(Math.abs(prevIdx - nextIdx) <= 1) {
                  this._previousTreeSelectedActor = this.recentButton.actor;
               }
            }
            this.recentButton.isHovered = false;
         }));

         this.categoriesBox.add_actor(this.recentButton.actor);
         this._categoryButtons.push(this.recentButton);

         for(let id = 0; id < MAX_RECENT_FILES && id < this.RecentManager._infosByTimestamp.length; id++) {
            let button = new RecentButtonExtended(this, this.RecentManager._infosByTimestamp[id]);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text(button.file.uri.slice(7));
               this.hover.refreshFile(button.file);
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.selectedAppTitle.set_text("");
               this.selectedAppDescription.set_text("");
               this.hover.refreshFace();
            }));
            this._recentButtons.push(button);
         }
         if(this.RecentManager._infosByTimestamp.length > 0) {
            let button = new RecentClearButtonExtended(this);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.hover.refresh("edit-clear");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.hover.refreshFace();
            }));
            this._recentButtons.push(button);
         }
      }
      this._setCategoriesButtonActive(!this.searchActive);
   },

//systemButtons
   _powerButtons: function(verticalPane) {        
      //Separator
      /*if(launchers.length!=0){
         let separator = new PopupMenu.PopupSeparatorMenuItem();
         powerButton.add_actor(separator.actor, { y_align: St.Align.END, y_fill: false });                   
      }*/
      let powerButtons = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: verticalPane });
      this._systemButtons = new Array();
      powerButtons.connect('key-focus-in', Lang.bind(this, function(actor, event) {        
         if(this._systemButtons.length > 0) {
            if(!this.sysButtSelected)
               this.sysButtSelected = 0;
            this._systemButtons[this.sysButtSelected].setActive(true);
            if(this.signalKeyPowerID == 0)
               this.signalKeyPowerID = powerButtons.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         }
      }));
      powerButtons.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         for(let cSys in this._systemButtons)
            this._systemButton[cSys].setActive(false);
         if(this.signalKeyPowerID > 0)
            powerButtons.disconnect(this.signalKeyPowerID);
      }));
      //Lock screen
      let button = new SystemButton(this, "gnome-lockscreen", 3, _("Lock screen"), _("Lock the screen"), this.hover);
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));
      button.setAction(Lang.bind(this, this._onLockScreenAction));     
        
      powerButtons.add_actor(button.actor);
      this._systemButtons[0] = button;
        
      //Logout button
      button = new SystemButton(this, "gnome-logout", 3, _("Logout"), _("Leave the session"), this.hover);        
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent));
      button.setAction(Lang.bind(this, this._onLogoutAction));

      powerButtons.add_actor(button.actor, { y_align: St.Align.END, y_fill: false }); 
      this._systemButtons[1] = button;

      //Shutdown button
      button = new SystemButton(this, "gnome-shutdown", 3, _("Quit"), _("Shutdown the computer"), this.hover);        
      button.actor.connect('enter-event', Lang.bind(this, this._sysButtonEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._sysButtonLeaveEvent)); 
      button.setAction(Lang.bind(this, this._onShutdownAction));
        
      powerButtons.add_actor(button.actor, { y_align: St.Align.END, y_fill: false });
      this._systemButtons[2] = button;
      return powerButtons;
   },

   _sysButtonEnterEvent: function(actor, event) {
      this.old_active_item_actor = this._activeActor;
      /*let item_actor = this.applicationsBox.get_child_at_index(this.applicationsBox.get_children().length -1);
      this._scrollToButton(item_actor._delegate);*/
      this.applicationsScrollBox.vscroll.get_adjustment().set_value(this.applicationsScrollBox.vscroll.get_adjustment().upper);

      this.applicationsScrollBox.set_auto_scrolling(false);
      this.categoriesScrollBox.set_auto_scrolling(false);
      this.favoritesScrollBox.set_auto_scrolling(false);
    
      let index = this._indexOfSysButton(actor);
      this.selectedAppTitle.set_text(this._systemButtons[index].title);
      this.selectedAppDescription.set_text(this._systemButtons[index].description);
      this.hover.refresh(this._systemButtons[index].icon);
   },

   _sysButtonLeaveEvent: function(actor, event) {
      this._scrollToButton(this.old_active_item_actor._delegate);
      this.applicationsScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.set_auto_scrolling(this.autoscroll_enabled);
      this.selectedAppTitle.set_text("");
      this.selectedAppDescription.set_text("");
      this.hover.refreshFace();
   },

   _indexOfSysButton: function(actor) {
      for(sysB in this._systemButtons)
         if(this._systemButtons[sysB].actor == actor)
            return sysB;
      return -1;
   },

   _onLockScreenAction: function() {
      this.menu.close();
            
      let screensaver_settings = new Gio.Settings({ schema: "org.cinnamon.screensaver" });                        
      let screensaver_dialog = Gio.file_new_for_path("/usr/bin/cinnamon-screensaver-command");    
      if(screensaver_dialog.query_exists(null)) {
         if(screensaver_settings.get_boolean("ask-for-away-message")) {                                    
            Util.spawnCommandLine("cinnamon-screensaver-lock-dialog");
         }
         else {
            Util.spawnCommandLine("cinnamon-screensaver-command --lock");
         }
      }
      else {                
         this._screenSaverProxy.LockRemote();
      }     
   },

   _onLogoutAction: function() {
      this.menu.close();
      this._session.LogoutRemote(0);
   },

   _onShutdownAction: function() {
      this.menu.close();
      this._session.ShutdownRemote();
   },
//systemButtons
   _appLeaveEvent: function(a, b, applicationButton) {
      this._previousSelectedActor = applicationButton.actor;
      applicationButton.actor.style_class = "menu-application-button";
      this.selectedAppTitle.set_text("");
      this.selectedAppDescription.set_text("");
      this.hover.refreshFace();
   },

   _appEnterEvent: function(applicationButton) {
      this.selectedAppTitle.set_text(applicationButton.app.get_name());
      if(applicationButton.app.get_description())
         this.selectedAppDescription.set_text(applicationButton.app.get_description());
      else
         this.selectedAppDescription.set_text("");
      this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(applicationButton.actor);
      this._clearPrevAppSelection(applicationButton.actor);
      applicationButton.actor.style_class = "menu-application-button-selected";
      this.hover.refreshApp(applicationButton.app);
   },

   _addEnterEvent: function(button, callback) {
      let _callback = Lang.bind(this, function() {
         try {
            let parent = button.actor.get_parent();
            if(parent != this.categoriesBox)
               parent = parent.get_parent();
            if(this._activeContainer !== this.applicationsBox && parent !== this._activeContainer) {
               this._previousTreeItemIndex = this._selectedItemIndex;
               this._previousTreeSelectedActor = this._activeActor;
               this._previousSelectedActor = null;
            }
            if(this._previousTreeSelectedActor && this._activeContainer !== this.categoriesBox &&
               parent !== this._activeContainer && button !== this._previousTreeSelectedActor) {
               this._previousTreeSelectedActor.style_class = "menu-category-button";
            }
            if(parent != this._activeContainer) {
                parent._vis_iter.reloadVisible();
            }
            let _maybePreviousActor = this._activeActor;
            if(_maybePreviousActor && this._activeContainer === this.applicationsBox) {
               this._previousSelectedActor = _maybePreviousActor;
               this._clearPrevAppSelection();
            }
            if(parent === this.categoriesBox && !this.searchActive) {
               this._previousSelectedActor = _maybePreviousActor;
               this._clearPrevCatSelection();
            }
            this._activeContainer = parent;
            this._activeActor = button.actor;
            this._selectedItemIndex = this._activeContainer._vis_iter.getAbsoluteIndexOfChild(this._activeActor);
            this._selectedColumnIndex = this._activeContainer._vis_iter.getInternalIndexOfChild(this._activeActor);
            callback();
         } catch(e) {
            Main.notify("error", e.message);
         }
      });
      button.connect('enter-event', _callback);
      button.actor.connect('enter-event', _callback);
   },

   _loadCategory: function(dir, top_dir) {
      var iter = dir.iter();
      var has_entries = false;
      var nextType;
      if(!top_dir) top_dir = dir;
      while((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
         if(nextType == GMenu.TreeItemType.ENTRY) {
            var entry = iter.get_entry();
            if(!entry.get_app_info().get_nodisplay()) {
               has_entries = true;
               var app = appsys.lookup_app_by_tree_entry(entry);
               if(!app)
                  app = appsys.lookup_settings_app_by_tree_entry(entry);
               var app_key = app.get_id()
               if(app_key == null) {
                  app_key = app.get_name() + ":" + 
                  app.get_description();
               }
               if(!(app_key in this._applicationsButtonFromApp)) {
                  let applicationButton = new ApplicationButtonExtended(this, app);
                  this._applicationsButtons.push(applicationButton);
                  applicationButton.actor.connect('realize', Lang.bind(this, this._onApplicationButtonRealized));
                  applicationButton.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, applicationButton));
                  this._addEnterEvent(applicationButton, Lang.bind(this, this._appEnterEvent, applicationButton));
                  applicationButton.category.push(top_dir.get_menu_id());
                  this._applicationsButtonFromApp[app_key] = applicationButton;
               } else {
                  this._applicationsButtonFromApp[app_key].category.push(dir.get_menu_id());
               }
            }
         } else if (nextType == GMenu.TreeItemType.DIRECTORY) {
            let subdir = iter.get_directory();
            if(this._loadCategory(subdir, top_dir)) {
               has_entries = true;
            }
         }
      }
      return has_entries;
   },

   _onOpenStateChanged: function(menu, open) {
      if(open) {
         this.timeDate.startTimer();
         this.menuIsOpening = true;
         this.actor.add_style_pseudo_class('active');
         global.stage.set_key_focus(this.searchEntry);
         this._selectedItemIndex = null;
         this._activeContainer = null;
         this._activeActor = null;
         this.sysButtSelected = 0;
        //  let monitorHeight = Main.layoutManager.primaryMonitor.height;
         if(!this.controlingHeight) {
            let applicationsBoxHeight = this.applicationsBox.get_allocation_box().y2-this.applicationsBox.get_allocation_box().y1;
            let scrollBoxHeight = (this.favoritesBox.get_allocation_box().y2-this.favoritesBox.get_allocation_box().y1) -
                                  (this.searchBox.get_allocation_box().y2-this.searchBox.get_allocation_box().y1);
            this.applicationsScrollBox.style = "height: "+scrollBoxHeight+"px;";
         }
         this.initButtonLoad = 30;
         let n = Math.min(this._applicationsButtons.length, this.initButtonLoad)
         for(let i = 0; i < n; i++) {
            if(!this._applicationsButtons[i].actor.visible) {
                this._applicationsButtons[i].actor.show();
            }
         }
         this._allAppsCategoryButton.actor.style_class = "menu-category-button-selected";
         Mainloop.idle_add(Lang.bind(this, this._initial_cat_selection));
      } else {
         this.actor.remove_style_pseudo_class('active');
         if(this.searchActive) {
            this.resetSearch();
         }
         this.selectedAppTitle.set_text("");
         this.selectedAppDescription.set_text("");
         this.hover.refreshFace();
         this._previousTreeItemIndex = null;
         this._previousTreeSelectedActor = null;
         this._previousSelectedActor = null;
         this.closeApplicationsContextMenus(null, false);
         this._clearAllSelections(false);
         this._refreshFavs();
         this.destroyVectorBox();
         this._systemButtons[this.sysButtSelected].setActive(false);
         this.timeDate.closeTimer();
      }
   }
};

function main(metadata, orientation, panel_height, instance_id) {  
    let myApplet = new MyApplet(orientation, panel_height, instance_id);
    return myApplet;      
}
