/**
 * jsonPickle/javascript/unpickler -- Conversion from music21p jsonpickle streams
 *
 * Copyright (c) 2013-14, Michael Scott Cuthbert and cuthbertLab
 * Based on music21 (=music21p), Copyright (c) 2006–14, Michael Scott Cuthbert and cuthbertLab
 * 
 * usage:
 * 
 * js_obj = unpickler.decode(json_string);
 * 
 * 
 */

define(function(require) {
    var unpickler = {};
    
    unpickler.decode = function (string, handlers, options) {
        var params = {
          keys: false,
          safe: false,
          reset: true,
          backend: JSON,          
        };
        unpickler.merge(params, options);
        
        var use_handlers = {
          'fractions.Fraction': {
              restore: function(obj) {
                  return obj._numerator / obj._denominator;
              }
          },   
        };
        unpickler.merge(use_handlers, handlers);
        
        // backend does not do anything -- there for
        // compat with py-JSON-Pickle        
        if (params.context === undefined) {
            var unpickler_options = {
                keys: params.keys,
                backend: params.backend,
                safe: params.safe,
            };
            context = new unpickler.Unpickler(unpickler_options, use_handlers);
        }
        var jsonObj = params.backend.parse(string);
        return context.restore(jsonObj, params.reset);
    };

    unpickler.Unpickler = function (options, handlers) {
        var params = {
            keys: false,
            safe: false,
        };
        unpickler.merge(params, options);
        this.keys = params.keys;
        this.safe = params.safe;
        
        this.handlers = handlers;
        //obsolete...
        //this._namedict = {};
        
        // The namestack grows whenever we recurse into a child object
        this._namestack = [];
        
        // Maps objects to their index in the _objs list
        this._obj_to_idx = {};
        this._objs = [];
    };
    
    unpickler.Unpickler.prototype.reset = function () {
        //this._namedict = {};
        this._namestack = [];
        this._obj_to_idx = {};
        this._objs = [];
    };
    
    /**
     * Restores a flattened object to a JavaScript representation
     * as close to the original python object as possible.
     * 
     * Requires that javascript 
     */
    unpickler.Unpickler.prototype.restore = function (obj, reset) {
        if (reset) {
            this.reset();
        }
        return this._restore(obj);
    };
    
    unpickler.Unpickler.prototype._restore = function (obj) {
        var has_tag = unpickler.has_tag;
        var tags = unpickler.tags;
        var restore = undefined;
        if (has_tag(obj, tags.ID)) {
            restore = this._restore_id.bind(this);
        } else if (has_tag(obj, tags.REF)) {
            // backwards compat. not supported
        } else if (has_tag(obj, tags.TYPE)) {
            restore = this._restore_type.bind(this);
        } else if (has_tag(obj, tags.REPR)) {
            // backwards compat. not supported
        } else if (has_tag(obj, tags.OBJECT)) {
            restore = this._restore_object.bind(this);
        } else if (unpickler.is_list(obj)) {
            restore = this._restore_list.bind(this);
        } else if (has_tag(obj, tags.TUPLE)) {
            restore = this._restore_tuple.bind(this);            
        } else if (has_tag(obj, tags.SET)) {
            restore = this._restore_set.bind(this);
        } else if (unpickler.is_dictionary(obj)) {
            restore = this._restore_dict.bind(this);
        } else {
            restore = function (obj) { return obj; };
        }
        return restore(obj);
    };
    
    unpickler.Unpickler.prototype._restore_id = function (obj) {
        return this._objs[obj[unpickler.tags.ID]];
    };

    unpickler.Unpickler.prototype._restore_type = function (obj) {
        var typeref = unpickler.loadclass(obj[unpickler.tags.TYPE]);
        if (typeref === undefined) {
            return obj;
        } else {
            return typeref;
        }
    };
    
    unpickler.Unpickler.prototype._restore_object = function (obj) {
        var class_name = obj[unpickler.tags.OBJECT];
        var handler = this.handlers[class_name];
        if (handler !== undefined) {
            var instance = handler.restore(obj);
            return this._mkref(instance);
        } else {
            var cls = unpickler.loadclass(class_name);
            if (cls === undefined) {
                return this._mkref(obj);
            }
            return this._restore_object_instance(obj, cls);
        }
    };
    unpickler.Unpickler.prototype._loadfactory = function (obj) {
        var default_factory = obj['default_factory'];
        if (default_factory === undefined) {
            return undefined;
        } else {
            obj['default_factory'] = undefined;
            return this._restore(default_factory);
        }
    };
    
    
    unpickler.Unpickler.prototype._restore_object_instance = function (obj, cls) {
        //var factory = this._loadfactory(obj);
        var args = unpickler.getargs(obj);
        if (args.length > 0) {
            args = this._restore(args);
        }
        // not using factory... does not seem to apply to JS
        var instance = unpickler.construct(cls, args);
        this._mkref(instance);
        return this._restore_object_instance_variables(obj, instance);
    };
    
    unpickler.Unpickler.prototype._restore_object_instance_variables = function (obj, instance) {
        var has_tag = unpickler.has_tag;
        var restore_key = this._restore_key_fn();
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        keys.sort();
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (unpickler.reserved.indexOf(k) != -1) {
                continue;
            }
            var v = obj[k];
            this._namestack.push(k);
            k = restore_key(k);
            var value = undefined;
            if (v !== undefined && v !== null) {
                value = this._restore(v);                
            }
            // no setattr checks...
            instance[k] = value;
            this._namestack.pop();
        }
        if (has_tag(obj, unpickler.tags.SEQ)) {
            if (instance.push !== undefined) {
                for (var v in obj[unpickler.tags.SEQ]) {
                    instance.push(this._restore(v));
                }
            } // no .add ...            
        }
        
        if (has_tag(obj, unpickler.tags.STATE)) {
            instance = this._restore_state(obj, instance);
        }
        return instance;
    };
    
    
    unpickler.Unpickler.prototype._restore_state = function (obj, instance) {
        // only if the JS object implements __setstate__
        if (instance.__setstate__ !== undefined) {
            var state = this._restore(obj[unpickler.tags.STATE]);
            instance.__setstate__(state);
        } else {
            instance = this._restore(obj[unpickler.tags.STATE]);
        }
        return instance;
    };

    unpickler.Unpickler.prototype._restore_list = function (obj) {
        var parent = [];
        this._mkref(parent);
        var children = [];
        for (var i = 0; i < obj.length; i++) {
            var v = obj[i];
            children.push(this._restore(v));
        }
        parent.push.apply(parent, children);
        return parent;
    };
    unpickler.Unpickler.prototype._restore_tuple = function (obj) {
        // JS having no difference between list, tuple, set -- returns Array
        var children = [];
        for (var v in obj[unpickler.tags.TUPLE]) {
            children.push(this._restore(v));
        }
        return children;
    };
    unpickler.Unpickler.prototype._restore_set = function (obj) {
        // JS having no difference between list, tuple, set -- returns Array
        var children = [];
        for (var v in obj[unpickler.tags.SET]) {
            children.push(this._restore(v));
        }
        return children;
    };
    unpickler.Unpickler.prototype._restore_dict = function (obj) {
        var data = {};
        var restore_key = this._restore_key_fn();
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        keys.sort();
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var v = obj[k];
            
            this._namestack.push(k);
            k = restore_key(k);
            data[k] = this._restore(v);
            // no setattr checks...
            this._namestack.pop();
        }
        return data;
    };
    
    unpickler.Unpickler.prototype._restore_key_fn = function () {
        if (this.keys) {
            return function (key) {
                if (key.indexOf(unpickler.tags.JSON_KEY) == 0) {
                    key = unpickler.decode(key.slice(unpickler.tags.JSON_KEY.length),
                            this.handlers,
                            {context: this, keys: this.keys, reset: false}
                    );
                    return key;
                }
            };
        } else {
            return function (key) { return key; };
        }
    };
    
    // _refname not needed...
    
    unpickler.Unpickler.prototype._mkref = function (obj) {
        // does not use id(obj) in javascript
        this._objs.push(obj);
        return obj;
    };
    
    
    unpickler.getargs = function (obj) {
        var tags = unpickler.tags;
        var seq_list = obj[tags.SEQ];
        var obj_dict = obj[tags.OBJECT];
        if (seq_list === undefined || obj_dict === undefined) {
            return [];
        }
        var typeref = unpickler.loadclass(obj_dict);
        if (typeref === undefined) {
            return [];
        }
        if (typeref['_fields'] !== undefined) {
            if (typeref['_fields'].length == seq_list.length) {
                return seq_list;
            }
        }
        return [];
    };
    
    unpickler.loadclass = function (module_and_name) {
        var main_check = '__main__.';
        if (module_and_name.indexOf(main_check) == 0) {
            module_and_name = module_and_name.slice(main_check.length);
        }
        var parent = window;
        var module_class_split = module_and_name.split('.');
        for (var i = 0; i < module_class_split.length; i++) {
            var this_module_or_class = module_class_split[i];
            parent = parent[this_module_or_class];
            if (parent === undefined) {
                return parent;
            }
        }
        return parent;
    };
    
    unpickler.has_tag = function (obj, tag) {
        if ((typeof obj == 'object') &&
                (obj[tag] !== undefined)) {
            return true;
        } else {
            return false;
        }
    };
    
    unpickler.tags = {
        ID: 'py/id',
        OBJECT: 'py/object',
        TYPE: 'py/type',
        REPR: 'py/repr',
        REF: 'py/ref',
        TUPLE: 'py/tuple',
        SET: 'py/set',
        SEQ: 'py/seq',
        STATE: 'py/state',
        JSON_KEY: 'json://',
    };
    unpickler.reserved = [unpickler.tags.ID, unpickler.tags.OBJECT, 
                          unpickler.tags.TYPE, unpickler.tags.REPR, 
                          unpickler.tags.REF, unpickler.tags.TUPLE, 
                          unpickler.tags.SET, unpickler.tags.SEQ, 
                          unpickler.tags.STATE, unpickler.tags.JSON_KEY];
    
    
    unpickler.is_list = function (obj) {
        return (obj instanceof Array);
    };
    unpickler.is_dictionary = function (obj) {
        return ((typeof obj == 'object') && (obj !== null));
    };
    // move to utils -- from Vex.Flow.Merge
    unpickler.merge = function(destination, source) {
        if (source !== undefined) {
            for (var property in source) {
                destination[property] = source[property];
            }            
        }
        return destination;
    };

    // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
    unpickler.construct = function (constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;
        return new F();
    };
    
    return unpickler;    
});