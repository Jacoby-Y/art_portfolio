
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function self(fn) {
        return function (event) {
            // @ts-ignore
            if (event.target === this)
                fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/pages/Gallery.svelte generated by Svelte v3.44.0 */
    const file$5 = "src/pages/Gallery.svelte";

    // (52:37) 
    function create_if_block_3(ctx) {
    	let h3;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Graffiti Tag";
    			t1 = space();
    			div = element("div");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$5, 52, 12, 2478);
    			attr_dev(div, "class", "content-t1 svelte-1vknq4o");
    			set_style(div, "background-image", "url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Example_image.svg/600px-Example_image.svg.png')");
    			add_location(div, file$5, 53, 12, 2534);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(52:37) ",
    		ctx
    	});

    	return block;
    }

    // (49:37) 
    function create_if_block_2(ctx) {
    	let h3;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Graffiti Tag";
    			t1 = space();
    			div = element("div");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$5, 49, 12, 2089);
    			attr_dev(div, "class", "content-t1 svelte-1vknq4o");
    			set_style(div, "background-image", "url('https://lh3.googleusercontent.com/pw/AM-JKLUxkKdg-9Y4OMqZHzTDM5EI7K3kuMukSnFsJkXW3SPpLEZmQxRMpSNEPzH8kR8BNd4s247YN-CnQn6490aXB5NF1Etuc-085XOyguTXJRreRDwfrMuwGczfppmK1BnuBstwm7vIJn-WTE8o7EjYguf5=w886-h664-no?authuser=0')");
    			add_location(div, file$5, 50, 12, 2145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(49:37) ",
    		ctx
    	});

    	return block;
    }

    // (46:37) 
    function create_if_block_1(ctx) {
    	let h3;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Still Life";
    			t1 = space();
    			div = element("div");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$5, 46, 12, 1702);
    			attr_dev(div, "class", "content-t1 svelte-1vknq4o");
    			set_style(div, "background-image", "url('https://lh3.googleusercontent.com/pw/AM-JKLU-nDYPeyd4MiWH2TzDGnu8_Zr1RggjWbsB27KOOcCpKb3AD40JG7Of09Tdxzqgi2GTBeJ0aUF2Gi5tTrccbQqgY1vHNRpA9m0lLspfuM2740WWqTF8YhBYxKuhS6yws5IFH-N4onXHmzt6bh9e9Du_=w498-h664-no?authuser=0')");
    			add_location(div, file$5, 47, 12, 1756);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(46:37) ",
    		ctx
    	});

    	return block;
    }

    // (43:8) {#if content_index == 0}
    function create_if_block(ctx) {
    	let h3;
    	let t1;
    	let div;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Sketchbook Cover";
    			t1 = space();
    			div = element("div");
    			attr_dev(h3, "class", "content-title svelte-1vknq4o");
    			add_location(h3, file$5, 43, 12, 1309);
    			attr_dev(div, "class", "content-t1 svelte-1vknq4o");
    			set_style(div, "background-image", "url('https://lh3.googleusercontent.com/pw/AM-JKLVJbrL75D_1m6KPob2o-1XxXrn88LrIY9J0v4-2S6t0NflG3Bd_c7ma14_AObqfkmK4GXjxhiLbJasMI8LHuVQOvBogjHLrN9oozza2unxyAZlgJ9rHOiw4UqvOIkhs5D-av1n6uPW-dQmY56v-S2o1=w886-h664-no?authuser=0')");
    			add_location(div, file$5, 44, 12, 1369);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(43:8) {#if content_index == 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let div0;
    	let h30;
    	let t1;
    	let div1;
    	let h31;
    	let t3;
    	let div2;
    	let t4;
    	let div3;
    	let h32;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*content_index*/ ctx[2] == 0) return create_if_block;
    		if (/*content_index*/ ctx[2] == 1) return create_if_block_1;
    		if (/*content_index*/ ctx[2] == 2) return create_if_block_2;
    		if (/*content_index*/ ctx[2] == 3) return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Back";
    			t1 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "<";
    			t3 = space();
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t4 = space();
    			div3 = element("div");
    			h32 = element("h3");
    			h32.textContent = ">";
    			add_location(h30, file$5, 39, 31, 1097);
    			attr_dev(div0, "class", "home");
    			add_location(div0, file$5, 39, 4, 1070);
    			attr_dev(h31, "class", "arrow svelte-1vknq4o");
    			add_location(h31, file$5, 40, 70, 1187);
    			attr_dev(div1, "id", "prev");
    			attr_dev(div1, "class", "arrow-wrapper svelte-1vknq4o");
    			add_location(div1, file$5, 40, 4, 1121);
    			attr_dev(div2, "id", "content");
    			attr_dev(div2, "class", "svelte-1vknq4o");
    			add_location(div2, file$5, 41, 4, 1225);
    			attr_dev(h32, "class", "arrow svelte-1vknq4o");
    			add_location(h32, file$5, 56, 69, 2797);
    			attr_dev(div3, "id", "next");
    			attr_dev(div3, "class", "arrow-wrapper svelte-1vknq4o");
    			add_location(div3, file$5, 56, 4, 2732);
    			attr_dev(main, "class", "comp-main svelte-1vknq4o");
    			add_location(main, file$5, 38, 0, 1021);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h30);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			append_dev(div1, h31);
    			append_dev(main, t3);
    			append_dev(main, div2);
    			if (if_block) if_block.m(div2, null);
    			/*div2_binding*/ ctx[7](div2);
    			append_dev(main, t4);
    			append_dev(main, div3);
    			append_dev(div3, h32);
    			/*main_binding*/ ctx[9](main);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(div3, "click", /*click_handler_2*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (if_block) {
    				if_block.d();
    			}

    			/*div2_binding*/ ctx[7](null);
    			/*main_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const index_length = 4;

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gallery', slots, []);
    	let { shown = false } = $$props;
    	let content;
    	let content_index = 0;
    	let in_transition = false;
    	let wrapper;

    	onMount(() => {
    		
    	});

    	const next_item = num => {
    		if (in_transition) return;
    		in_transition = true;
    		$$invalidate(1, content.style.transform = "rotateY(90deg)", content);

    		setTimeout(
    			() => {
    				if (content_index + num >= index_length) $$invalidate(2, content_index = 0); else if (content_index + num < 0) $$invalidate(2, content_index = index_length - 1); else $$invalidate(2, content_index += num);

    				// Set next content item
    				$$invalidate(1, content.style.transform = "rotateY(0deg)", content);

    				setTimeout(
    					() => {
    						in_transition = false;
    					},
    					300
    				);
    			},
    			300
    		);
    	};

    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Gallery> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => next_item(-1);

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			content = $$value;
    			$$invalidate(1, content);
    		});
    	}

    	const click_handler_2 = () => next_item(1);

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(4, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(4, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		shown,
    		content,
    		content_index,
    		index_length,
    		in_transition,
    		wrapper,
    		next_item
    	});

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(4, shown = $$props.shown);
    		if ('content' in $$props) $$invalidate(1, content = $$props.content);
    		if ('content_index' in $$props) $$invalidate(2, content_index = $$props.content_index);
    		if ('in_transition' in $$props) in_transition = $$props.in_transition;
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 17) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}
    	};

    	return [
    		wrapper,
    		content,
    		content_index,
    		next_item,
    		shown,
    		click_handler,
    		click_handler_1,
    		div2_binding,
    		click_handler_2,
    		main_binding
    	];
    }

    class Gallery extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { shown: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gallery",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get shown() {
    		throw new Error("<Gallery>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Gallery>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/AboutMe.svelte generated by Svelte v3.44.0 */

    const file$4 = "src/pages/AboutMe.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div;
    	let h3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			add_location(h3, file$4, 18, 31, 387);
    			attr_dev(div, "class", "home");
    			add_location(div, file$4, 18, 4, 360);
    			attr_dev(main, "class", "comp-main svelte-1tx04");
    			add_location(main, file$4, 17, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AboutMe', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;
    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AboutMe> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class AboutMe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutMe",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get shown() {
    		throw new Error("<AboutMe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<AboutMe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/BestArt.svelte generated by Svelte v3.44.0 */

    const file$3 = "src/pages/BestArt.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let div;
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			t1 = space();
    			iframe = element("iframe");
    			add_location(h3, file$3, 18, 31, 387);
    			attr_dev(div, "class", "home");
    			add_location(div, file$3, 18, 4, 360);
    			attr_dev(iframe, "id", "slides");
    			attr_dev(iframe, "title", "Best artwork");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vQB_4gWFfBFnah6zQt0qnuSUKiOnIiLViX_1qyNY1jVNpVrAKmMxXTdhvCfgmXTCgScQox9xaQOT4Hn/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			attr_dev(iframe, "class", "svelte-1s2efni");
    			add_location(iframe, file$3, 19, 4, 411);
    			attr_dev(main, "class", "comp-main svelte-1s2efni");
    			add_location(main, file$3, 17, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			append_dev(main, t1);
    			append_dev(main, iframe);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BestArt', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;
    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BestArt> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class BestArt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BestArt",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get shown() {
    		throw new Error("<BestArt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<BestArt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Timeline.svelte generated by Svelte v3.44.0 */

    const file$2 = "src/pages/Timeline.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let div;
    	let h3;
    	let t1;
    	let iframe;
    	let iframe_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			t1 = space();
    			iframe = element("iframe");
    			add_location(h3, file$2, 18, 31, 387);
    			attr_dev(div, "class", "home");
    			add_location(div, file$2, 18, 4, 360);
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://docs.google.com/presentation/d/e/2PACX-1vTEtC6AKf75Hf6b-iZOveZYoYdUi6JowmEURVbUsIdh2wbianTBTnr9jRFwBHL1MUKP2SJ4SGuFMWzr/embed?start=false&loop=false&delayms=3000")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "width", "85%");
    			attr_dev(iframe, "height", "90%");
    			iframe.allowFullscreen = "true";
    			attr_dev(iframe, "mozallowfullscreen", "true");
    			attr_dev(iframe, "webkitallowfullscreen", "true");
    			add_location(iframe, file$2, 20, 4, 461);
    			attr_dev(main, "class", "comp-main svelte-18z4ixk");
    			add_location(main, file$2, 17, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			append_dev(main, t1);
    			append_dev(main, iframe);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Timeline', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;
    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timeline",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get shown() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Statement.svelte generated by Svelte v3.44.0 */
    const file$1 = "src/pages/Statement.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div;
    	let h3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Back";
    			add_location(h3, file$1, 20, 31, 446);
    			attr_dev(div, "class", "home");
    			add_location(div, file$1, 20, 4, 419);
    			attr_dev(main, "class", "comp-main svelte-16g9omy");
    			add_location(main, file$1, 19, 0, 370);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h3);
    			/*main_binding*/ ctx[3](main);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*main_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Statement', slots, []);
    	let { shown = false } = $$props;
    	let wrapper;

    	onMount(() => {
    		
    	});

    	const writable_props = ['shown'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Statement> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function main_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			wrapper = $$value;
    			($$invalidate(0, wrapper), $$invalidate(1, shown));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    	};

    	$$self.$capture_state = () => ({ onMount, shown, wrapper });

    	$$self.$inject_state = $$props => {
    		if ('shown' in $$props) $$invalidate(1, shown = $$props.shown);
    		if ('wrapper' in $$props) $$invalidate(0, wrapper = $$props.wrapper);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wrapper, shown*/ 3) {
    			{
    				if (wrapper != null) {
    					if (shown) {
    						$$invalidate(0, wrapper.style.transform = "translate(0, 0)", wrapper);
    					} else {
    						$$invalidate(0, wrapper.style.transform = "translate(100%, 0)", wrapper);
    					}
    				}
    			}
    		}
    	};

    	return [wrapper, shown, click_handler, main_binding];
    }

    class Statement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { shown: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Statement",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get shown() {
    		throw new Error("<Statement>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shown(value) {
    		throw new Error("<Statement>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div6;
    	let div5;
    	let div0;
    	let t3;
    	let div1;
    	let t5;
    	let div2;
    	let t7;
    	let div3;
    	let t9;
    	let div4;
    	let t11;
    	let gallery;
    	let t12;
    	let bestart;
    	let t13;
    	let aboutme;
    	let t14;
    	let statement;
    	let t15;
    	let timeline;
    	let current;
    	let mounted;
    	let dispose;

    	gallery = new Gallery({
    			props: { shown: /*show0*/ ctx[0] },
    			$$inline: true
    		});

    	gallery.$on("click", /*click_handler_5*/ ctx[16]);

    	bestart = new BestArt({
    			props: { shown: /*show1*/ ctx[1] },
    			$$inline: true
    		});

    	bestart.$on("click", /*click_handler_6*/ ctx[17]);

    	aboutme = new AboutMe({
    			props: { shown: /*show2*/ ctx[2] },
    			$$inline: true
    		});

    	aboutme.$on("click", /*click_handler_7*/ ctx[18]);

    	statement = new Statement({
    			props: { shown: /*show3*/ ctx[3] },
    			$$inline: true
    		});

    	statement.$on("click", /*click_handler_8*/ ctx[19]);

    	timeline = new Timeline({
    			props: { shown: /*show4*/ ctx[4] },
    			$$inline: true
    		});

    	timeline.$on("click", /*click_handler_9*/ ctx[20]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Jacoby's Art Porfolio";
    			t1 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = "Gallery";
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Best Art";
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "About Me";
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "Artist Statement";
    			t9 = space();
    			div4 = element("div");
    			div4.textContent = "Art History Timeline";
    			t11 = space();
    			create_component(gallery.$$.fragment);
    			t12 = space();
    			create_component(bestart.$$.fragment);
    			t13 = space();
    			create_component(aboutme.$$.fragment);
    			t14 = space();
    			create_component(statement.$$.fragment);
    			t15 = space();
    			create_component(timeline.$$.fragment);
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-qnlcj9");
    			add_location(h1, file, 71, 1, 1983);
    			attr_dev(div0, "class", "menu-txt svelte-qnlcj9");
    			add_location(div0, file, 74, 3, 2181);
    			attr_dev(div1, "class", "menu-txt svelte-qnlcj9");
    			add_location(div1, file, 75, 3, 2248);
    			attr_dev(div2, "class", "menu-txt svelte-qnlcj9");
    			add_location(div2, file, 76, 3, 2316);
    			attr_dev(div3, "class", "menu-txt svelte-qnlcj9");
    			add_location(div3, file, 77, 3, 2384);
    			attr_dev(div4, "class", "menu-txt svelte-qnlcj9");
    			add_location(div4, file, 78, 3, 2460);
    			attr_dev(div5, "id", "menu-txt-wrapper");
    			attr_dev(div5, "class", "svelte-qnlcj9");
    			add_location(div5, file, 73, 2, 2150);
    			attr_dev(div6, "id", "background");
    			attr_dev(div6, "class", "svelte-qnlcj9");
    			add_location(div6, file, 72, 1, 2026);
    			attr_dev(main, "id", "main-wrapper");
    			attr_dev(main, "class", "svelte-qnlcj9");
    			add_location(main, file, 70, 0, 1957);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div5, t3);
    			append_dev(div5, div1);
    			append_dev(div5, t5);
    			append_dev(div5, div2);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			insert_dev(target, t11, anchor);
    			mount_component(gallery, target, anchor);
    			insert_dev(target, t12, anchor);
    			mount_component(bestart, target, anchor);
    			insert_dev(target, t13, anchor);
    			mount_component(aboutme, target, anchor);
    			insert_dev(target, t14, anchor);
    			mount_component(statement, target, anchor);
    			insert_dev(target, t15, anchor);
    			mount_component(timeline, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handle_key_down*/ ctx[10], false, false, false),
    					listen_dev(div0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[12], false, false, false),
    					listen_dev(div2, "click", /*click_handler_2*/ ctx[13], false, false, false),
    					listen_dev(div3, "click", /*click_handler_3*/ ctx[14], false, false, false),
    					listen_dev(div4, "click", /*click_handler_4*/ ctx[15], false, false, false),
    					listen_dev(div6, "click", self(/*toggle_background*/ ctx[5]), false, false, false),
    					listen_dev(div6, "mouseenter", /*enter_background*/ ctx[6], false, false, false),
    					listen_dev(div6, "mouseleave", /*leave_background*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const gallery_changes = {};
    			if (dirty & /*show0*/ 1) gallery_changes.shown = /*show0*/ ctx[0];
    			gallery.$set(gallery_changes);
    			const bestart_changes = {};
    			if (dirty & /*show1*/ 2) bestart_changes.shown = /*show1*/ ctx[1];
    			bestart.$set(bestart_changes);
    			const aboutme_changes = {};
    			if (dirty & /*show2*/ 4) aboutme_changes.shown = /*show2*/ ctx[2];
    			aboutme.$set(aboutme_changes);
    			const statement_changes = {};
    			if (dirty & /*show3*/ 8) statement_changes.shown = /*show3*/ ctx[3];
    			statement.$set(statement_changes);
    			const timeline_changes = {};
    			if (dirty & /*show4*/ 16) timeline_changes.shown = /*show4*/ ctx[4];
    			timeline.$set(timeline_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gallery.$$.fragment, local);
    			transition_in(bestart.$$.fragment, local);
    			transition_in(aboutme.$$.fragment, local);
    			transition_in(statement.$$.fragment, local);
    			transition_in(timeline.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gallery.$$.fragment, local);
    			transition_out(bestart.$$.fragment, local);
    			transition_out(aboutme.$$.fragment, local);
    			transition_out(statement.$$.fragment, local);
    			transition_out(timeline.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t11);
    			destroy_component(gallery, detaching);
    			if (detaching) detach_dev(t12);
    			destroy_component(bestart, detaching);
    			if (detaching) detach_dev(t13);
    			destroy_component(aboutme, detaching);
    			if (detaching) detach_dev(t14);
    			destroy_component(statement, detaching);
    			if (detaching) detach_dev(t15);
    			destroy_component(timeline, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let background;
    	let main_wrapper;

    	onMount(() => {
    		background = document.getElementById("background");
    		main_wrapper = document.getElementById("main-wrapper");
    	}); // toggle_background();

    	let background_out = false;
    	let show0 = false;
    	let show1 = false;
    	let show2 = false;
    	let show3 = false;
    	let show4 = false;

    	const toggle_background = () => {
    		if (background_out) background.style.clipPath = "circle(2% at 75% 50%)"; else background.style.clipPath = "circle(100% at 75% 50%)";
    		background_out = !background_out;
    	};

    	const enter_background = () => {
    		if (!background_out) background.style.clipPath = "circle(3% at 75% 50%)";
    	};

    	const leave_background = () => {
    		if (!background_out) background.style.clipPath = "circle(2% at 75% 50%)";
    	};

    	const load_menu = num => {
    		if (num == 0) $$invalidate(0, show0 = true); else if (num == 1) $$invalidate(1, show1 = true); else if (num == 2) $$invalidate(2, show2 = true); else if (num == 3) $$invalidate(3, show3 = true); else if (num == 4) $$invalidate(4, show4 = true);
    		main_wrapper.style.transform = "translate(-100%, 0)";
    	}; // setTimeout(() => { toggle_background(); }, 300);

    	// setTimeout(() => { toggle_background(); load_menu(0); }, 500);
    	const hide_component = num => {
    		if (num == 0) $$invalidate(0, show0 = false); else if (num == 1) $$invalidate(1, show1 = false); else if (num == 2) $$invalidate(2, show2 = false); else if (num == 3) $$invalidate(3, show3 = false); else if (num == 4) $$invalidate(4, show4 = false);
    		main_wrapper.style.transform = "translate(0, 0)";
    	};

    	const handle_key_down = e => {
    		if (e.key != "Escape") return;
    		$$invalidate(0, show0 = false);
    		$$invalidate(1, show1 = false);
    		$$invalidate(2, show2 = false);
    		$$invalidate(3, show3 = false);
    		$$invalidate(4, show4 = false);
    		main_wrapper.style.transform = "translate(0, 0)";
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => load_menu(0);
    	const click_handler_1 = () => load_menu(1);
    	const click_handler_2 = () => load_menu(2);
    	const click_handler_3 = () => load_menu(3);
    	const click_handler_4 = () => load_menu(4);
    	const click_handler_5 = () => hide_component(0);
    	const click_handler_6 = () => hide_component(1);
    	const click_handler_7 = () => hide_component(2);
    	const click_handler_8 = () => hide_component(3);
    	const click_handler_9 = () => hide_component(4);

    	$$self.$capture_state = () => ({
    		onMount,
    		Gallery,
    		AboutMe,
    		BestArt,
    		Timeline,
    		Statement,
    		background,
    		main_wrapper,
    		background_out,
    		show0,
    		show1,
    		show2,
    		show3,
    		show4,
    		toggle_background,
    		enter_background,
    		leave_background,
    		load_menu,
    		hide_component,
    		handle_key_down
    	});

    	$$self.$inject_state = $$props => {
    		if ('background' in $$props) background = $$props.background;
    		if ('main_wrapper' in $$props) main_wrapper = $$props.main_wrapper;
    		if ('background_out' in $$props) background_out = $$props.background_out;
    		if ('show0' in $$props) $$invalidate(0, show0 = $$props.show0);
    		if ('show1' in $$props) $$invalidate(1, show1 = $$props.show1);
    		if ('show2' in $$props) $$invalidate(2, show2 = $$props.show2);
    		if ('show3' in $$props) $$invalidate(3, show3 = $$props.show3);
    		if ('show4' in $$props) $$invalidate(4, show4 = $$props.show4);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		show0,
    		show1,
    		show2,
    		show3,
    		show4,
    		toggle_background,
    		enter_background,
    		leave_background,
    		load_menu,
    		hide_component,
    		handle_key_down,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body, props: {} });

    return app;

})();
//# sourceMappingURL=bundle.js.map
