/* Renovation Intelligence prototype: sample content.
   Everything here is SAMPLE data for the design review. Real rules, rates, products and
   area text come from Sam (docs/SCOPE.md section 2). Low and High only: no middle values. */
(function(){
  var RI = window.RI = window.RI || {};

  RI.PACKAGES = [
    {key:'E', name:'Essential', goal:'Fix what must be fixed'},
    {key:'S', name:'Standard',  goal:'Modernize, keep what is sound'},
    {key:'P', name:'Premium',   goal:'A higher finish throughout'}
  ];

  RI.EVIDENCE = {
    recorded:{label:'Recorded', fill:4, meaning:'From a public record, such as year built'},
    observed:{label:'Observed', fill:3, meaning:'Seen in one of your photos'},
    reported:{label:'Reported', fill:2, meaning:'Typed by you or stated in the listing'},
    inferred:{label:'Inferred', fill:1, meaning:'Worked out from a pattern or a typical size'},
    unknown: {label:'Unknown',  fill:0, meaning:'Not seen and not stated. Never zero'}
  };

  /* The sample house. Each item: per package [action, low, high, product]. low === null means keep, no cost. */
  RI.SAMPLE = {
    id:'lab-001', title:'Brick ranch, built 1986', area:'Clinton Township, MI',
    img:'brick-ranch.jpg', imgAlt:'Single-story brick ranch house with an attached garage and a lawn in front',
    facts:[['Year built','1986'],['Above grade','1,686 sq ft'],['Finished basement','about 300 sq ft'],['Bedrooms','3'],['Baths','1 full, 1 half'],['Photos','40, in 9 rooms']],
    rooms:[
      {key:'kitchen', name:'Kitchen', sub:'11 photos', items:[
        {id:'k1', name:'Base and wall cabinets', qty:'22 linear ft', ev:'observed', trade:'Cabinets', pk:{
          E:['Clean, adjust doors, replace two failed hinges',420,780],
          S:['Refinish fronts and boxes, new pulls at 18 positions',3900,6200,'Satin brass pull, 5 in'],
          P:['Replace with shaker cabinets',14800,24500,'Painted shaker, soft close']}},
        {id:'k2', name:'Countertop, plastic laminate', qty:'38 sq ft', ev:'observed', trade:'Countertops', pk:{
          E:['Keep, it is sound',null,null],
          S:['Replace with a stone-look laminate',1300,2100,'Stone-look laminate, square edge'],
          P:['Replace with quartz',3600,5800,'Quartz, eased edge']}},
        {id:'k3', name:'Sink and faucet', qty:'1 each', ev:'observed', trade:'Plumbing', pk:{
          E:['Replace the leaking faucet',280,460,'Single-handle faucet'],
          S:['New sink and pull-down faucet',650,1100,'Stainless sink, pull-down faucet'],
          P:['New undermount sink and faucet',1100,1800,'Undermount sink, matte faucet']}},
        {id:'k4', name:'Backsplash', qty:'30 sq ft', ev:'observed', trade:'Tile', pk:{
          E:['Keep',null,null],
          S:['New ceramic tile backsplash',900,1500,'3 by 6 in ceramic'],
          P:['New glazed tile backsplash',1400,2300,'Handmade-look glazed tile']}},
        {id:'k5', name:'Kitchen floor', qty:'Size not known', ev:'unknown', trade:'Flooring', state:'measure',
          fix:'The kitchen length and width, in feet', pk:{E:['Replace the sheet vinyl',1100,1800,'Sheet vinyl'],S:['Install LVP',1300,2100,'Oak-look LVP, 7 in plank'],P:['Install porcelain tile',2400,3900,'12 by 24 in porcelain']}},
        {id:'k6', name:'Ceiling light', qty:'1 fixture', ev:'observed', trade:'Electrical', pk:{
          E:['Keep',null,null],
          S:['Replace with two flush-mount fixtures',520,900,'LED flush mount'],
          P:['Add six recessed lights on a dimmer',1500,2600,'4 in LED recessed, dimmer']}}
      ]},
      {key:'living', name:'Living room and halls', sub:'7 photos', items:[
        {id:'l1', name:'Carpet', qty:'640 sq ft', ev:'observed', trade:'Flooring', pk:{
          E:['Deep clean, restretch at the doorway',350,600],
          S:['Remove carpet, install LVP',4200,6700,'Oak-look LVP, 7 in plank'],
          P:['Remove carpet, install engineered hardwood',7400,11200,'White oak engineered, 7 in']}},
        {id:'l2', name:'Baseboard', qty:'310 linear ft', ev:'inferred', trade:'Carpentry', pk:{
          E:['Keep',null,null],
          S:['Replace and paint',1550,2650,'Primed pine, 3.25 in'],
          P:['Replace with taller profile and paint',2000,3350,'Primed pine, 5.25 in']}}
      ]},
      {key:'bedrooms', name:'Bedrooms', sub:'3 rooms, 9 photos', items:[
        {id:'b1', name:'Carpet', qty:'412 sq ft from your sizes', ev:'reported', trade:'Flooring', pk:{
          E:['Keep, it is sound',null,null],
          S:['Remove carpet, install LVP',3100,4600,'Oak-look LVP, 7 in plank'],
          P:['Remove carpet, install engineered hardwood',4800,7200,'White oak engineered, 7 in']}},
        {id:'b2', name:'Closet doors', qty:'3 each', ev:'observed', trade:'Doors', pk:{
          E:['Adjust track, replace one guide',90,180],
          S:['Replace with new bifold doors',780,1350,'Shaker bifold'],
          P:['Replace with solid-core doors',1350,2250,'Solid-core shaker']}}
      ]},
      {key:'hallbath', name:'Hall bath', sub:'5 photos', items:[
        {id:'h1', name:'Tub and surround', qty:'1 each', ev:'unknown', trade:'Bath', state:'unverified',
          fix:'A photo of the tub and its walls', pk:{E:['Reglaze the tub and surround',900,1600],S:['Replace tub and tile surround',5200,8400,'Steel tub, 3 by 6 in tile'],P:['Soaking tub and full-height tile',6800,9000,'Soaking tub, large-format tile']}},
        {id:'h2', name:'Vanity and top', qty:'30 in', ev:'observed', trade:'Bath', pk:{
          E:['Tighten, reseal the top',150,300],
          S:['Replace vanity, top and faucet',1100,1900,'30 in vanity with top'],
          P:['Replace with a furniture-style vanity',2200,3600,'30 in furniture vanity, quartz top']}},
        {id:'h3', name:'Toilet', qty:'1 each', ev:'observed', trade:'Plumbing', pk:{
          E:['Replace the flapper and wax ring',120,220],
          S:['Replace with a water-saving toilet',450,750,'1.28 gpf elongated'],
          P:['Replace with a comfort-height toilet',650,1000,'Comfort height, soft close']}}
      ]},
      {key:'halfbath', name:'Half bath', sub:'2 photos', items:[
        {id:'f1', name:'Vanity and faucet', qty:'24 in', ev:'observed', trade:'Bath', pk:{
          E:['Replace the faucet',180,320,'Single-handle faucet'],
          S:['Replace vanity and faucet',900,1500,'24 in vanity with top'],
          P:['Replace with a wall-hung vanity',1700,2800,'24 in wall-hung vanity']}}
      ]},
      {key:'basement', name:'Basement', sub:'about 300 sq ft finished, 4 photos', items:[
        {id:'s1', name:'Carpet', qty:'300 sq ft', ev:'observed', trade:'Flooring', pk:{
          E:['Keep',null,null],
          S:['Remove carpet, install LVP',1950,3150,'Waterproof LVP'],
          P:['Remove carpet, install LVP with underlay',2700,4200,'Waterproof LVP, acoustic underlay']}},
        {id:'s2', name:'Wall paneling', qty:'1 room', ev:'unknown', trade:'Drywall', state:'unverified',
          fix:'A brighter photo of the basement walls', pk:{E:['Paint the paneling',600,1000],S:['Replace with painted drywall',2400,3900,'1/2 in drywall, eggshell paint'],P:['Drywall with insulation, painted',3300,5200,'Insulated drywall, eggshell paint']}}
      ]},
      {key:'whole', name:'Whole house', sub:'Paint, doors and lighting', items:[
        {id:'w1', name:'Interior paint, walls', qty:'4,900 sq ft wall area', ev:'inferred', trade:'Painting', pk:{
          E:['Paint the rooms that need it',1800,3000],
          S:['Paint all walls, two coats',10300,19100,'Low-VOC eggshell'],
          P:['Paint all walls and ceilings',13500,24000,'Low-VOC eggshell, flat ceilings']}},
        {id:'w2', name:'Interior doors', qty:'11 each', ev:'observed', trade:'Doors', pk:{
          E:['Adjust, new hardware where it fails',350,650],
          S:['Replace slabs with hardware',3400,6200,'Hollow-core shaker slab'],
          P:['Replace with solid-core doors',5500,9000,'Solid-core shaker slab']}},
        {id:'w3', name:'Light fixtures', qty:'14 each', ev:'observed', trade:'Electrical', pk:{
          E:['Replace two broken fixtures',180,340],
          S:['Replace dated fixtures',2100,3800,'LED flush mount and pendants'],
          P:['Replace all fixtures, add dimmers',4200,7000,'Designer LED fixtures, dimmers']}}
      ]},
      {key:'exterior', name:'Exterior', sub:'8 photos', items:[
        {id:'x1', name:'Front door', qty:'1 each', ev:'observed', trade:'Doors', pk:{
          E:['Repaint and new weatherstrip',250,450],
          S:['Replace with an insulated steel door',1600,2800,'Steel six-panel, prehung'],
          P:['Replace with a fiberglass door and sidelight',3000,4800,'Fiberglass, one sidelight']}},
        {id:'x2', name:'Trim paint', qty:'180 linear ft', ev:'observed', trade:'Painting', pk:{
          E:['Scrape and paint where peeling',600,1100],
          S:['Paint all exterior trim',1400,2400],
          P:['Paint trim, garage door and shutters',2000,3400]}}
      ]}
    ],
    mechanicals:[
      {name:'Roof', src:'Reported in the listing: replaced 2009', ev:'reported', life:'20 to 25 years for asphalt shingles', range:[9000,16000], text:'Look for curled or missing shingles and stains on the ceiling below. Asphalt roofs in Michigan often last 20 to 25 years. Have a roofer look before you buy.'},
      {name:'Heating and cooling', src:'Reported in the listing: furnace 2004', ev:'reported', life:'15 to 20 years for a gas furnace', range:[4500,9500], text:'A furnace of this age is worth a service visit. Ask for the last service record and check the filter and the flue.'},
      {name:'Water heater', src:'Not in the photos or the listing', ev:'unknown', life:'8 to 12 years for a tank', range:[1300,2800], text:'Check the label on the tank for the year. Look for rust at the base and around the fittings.'},
      {name:'Electrical panel', src:'Seen in one photo', ev:'observed', life:'Varies; only an electrician can judge it', range:[1800,4200], text:'We do not judge panels. An electrician can confirm its capacity and condition, especially before adding lighting or appliances.'}
    ]
  };


  /* Potential extra costs: conditional work and hidden-condition risks, kept apart from the total.
     Never assumed and never charged (guide p31, p59). Sample text; Sam supplies the real list. */
  RI.EXTRAS = [
    {t:'Subfloor repair', when:'If soft or damaged boards are found when the old carpet comes up', room:'Living room and halls'},
    {t:'Wall repair behind the backsplash', when:'If the wall is damaged when the old tile is removed', room:'Kitchen'},
    {t:'Damage behind the tub surround', when:'If the wall behind the tub is wet or rotted once it is opened', room:'Hall bath'},
    {t:'Circuit work for new lighting', when:'If an electrician finds the existing boxes or wiring cannot take the new fixtures', room:'Whole house'},
    {t:'Hidden condition in walls, floors and ceilings', when:'Anything that cannot be seen in a photo stays unknown until someone opens it', room:'Whole house'}
  ];
  /* Work this estimate does not include, stated plainly */
  RI.NOT_INCLUDED = ['Replacing the roof, furnace, air conditioning, water heater or electrical panel (guidance only)','Appliances, furniture and window coverings','Permits, inspections and city fees','Structural, foundation and drainage work','Testing or removal of hazardous materials','Landscaping, driveways and outdoor structures','Items you turned off'];
  /* Photos for product cards, by sample item and package (finish photos from Wikimedia, see credits) */
  RI.PRODUCT_IMG = {k1:{S:'finishes/cab-painted.jpg', P:'finishes/cab-shaker.jpg'}, k2:{S:'finishes/ct-stonelook.jpg', P:'finishes/ct-quartz.jpg'}, k4:{S:'finishes/bs-white.jpg', P:'finishes/bs-glazed.jpg'}, k3:{E:'finishes/fx-single.jpg', S:'finishes/fx-pulldown.jpg', P:'finishes/fx-black.jpg'}, k6:{S:'finishes/lt-flush.jpg', P:'finishes/lt-recessed.jpg'}, w3:{S:'finishes/lt-flush.jpg', P:'finishes/lt-recessed.jpg'}, l1:{S:'wood-floor.jpg', P:'wood-floor.jpg'}, b1:{S:'wood-floor.jpg', P:'wood-floor.jpg'}, s1:{S:'wood-floor.jpg', P:'wood-floor.jpg'}, k5:{S:'wood-floor.jpg'}, h2:{S:'finishes/fx-black.jpg', P:'finishes/fx-black.jpg'}, f1:{E:'finishes/fx-single.jpg', S:'finishes/fx-black.jpg', P:'finishes/fx-black.jpg'}};
  /* Room types to offer at intake (Sam's Volume 2, guide p24) */
  RI.ROOM_TYPES = {
    inside:[['kitchen','Kitchen'],['primary-bath','Primary bathroom'],['secondary-bath','Secondary bathroom'],['half-bath','Half bathroom'],['living','Living room'],['family','Family room'],['dining','Dining room'],['bedroom','Bedroom'],['office','Office'],['hallway','Hallway'],['laundry','Laundry'],['mudroom','Mudroom'],['basement','Basement'],['attic','Attic'],['mechanical','Mechanical room'],['entry','Entry'],['sunroom','Sunroom or bonus room'],['other','Other']],
    outside:[['ext-front','Front exterior'],['ext-rear','Rear exterior'],['ext-side','Side exterior'],['roof','Roof'],['garage','Garage'],['driveway','Driveway'],['deck','Deck'],['patio','Patio'],['porch','Porch'],['yard','Yard'],['pool','Pool'],['accessory','Accessory structure']]
  };

  /* Lines that cannot be priced: shown apart, never as zero */
  RI.isHeld = function(it){ return it.state === 'unverified' || it.state === 'measure'; };
  /* The estimate being shown: the sample house, unless the app sets RI.CURRENT to a user's house */
  RI.src = function(){ return RI.CURRENT || RI.SAMPLE; };
  /* Turning off an item also turns off the items that depend on it */
  RI.DEPS = {k2:[['k4','The backsplash is set with the new countertop.']], l1:[['l2','New baseboard goes in with the new floor.']]};

  /* Totals for one package, honoring switched-off items. Returns {low, high, partial, held} */
  RI.totals = function(pkg, off, roomKey){
    var low = 0, high = 0, held = 0;
    RI.src().rooms.forEach(function(r){
      if(roomKey && r.key !== roomKey) return;
      r.items.forEach(function(it){
        if(RI.isHeld(it)){ held++; return; }
        if(off && off[it.id]) return;
        var p = it.pk[pkg]; if(!p || p[1] == null) return;
        low += p[1]; high += p[2];
      });
    });
    return {low:low, high:high, partial:held > 0, held:held};
  };

  /* [work, detail, unit, Low per unit, High per unit, default size, min, max, step] */
  RI.SCOPE_DOCS = [
    {k:'kitchen', t:'Kitchen scope of work', trade:'Cabinets, countertops, plumbing', pages:6, d:'Cabinet refinish and replacement, countertop removal and install, sink and faucet reconnection, backsplash, protection and cleanup.',
     sec:[['Protect and prepare','Cover floors and adjacent rooms. Shut off water at the sink. Remove doors, drawers and hardware, labeled by position.'],['Cabinets','Refinish: clean, degrease, scuff sand, prime with a bonding primer, two finish coats. Replace: remove the run, check the wall for level, install base then wall cabinets.'],['Countertop and backsplash','Template after cabinets are set. Install the top, then the sink and faucet. Tile the backsplash after the top is sealed.'],['Close out','Reinstall hardware, adjust doors, test the plumbing for leaks, clean every surface.']]},
    {k:'bath', t:'Bathroom scope of work', trade:'Bath, plumbing, tile', pages:5, d:'Vanity and toilet replacement, tub reglaze or replacement, tile surround, ventilation check.',
     sec:[['Protect and prepare','Shut off water. Protect the hallway floor. Remove fixtures in order: toilet, vanity, accessories.'],['Tub and surround','Reglaze: clean, etch, mask, spray, cure 24 hours. Replace: remove the surround to the studs, set the tub level, install backer board, tile.'],['Fixtures','Set the vanity and top, connect supply lines, set the toilet on a new wax ring, test for leaks.'],['Close out','Caulk, seal grout, clean, check the fan runs.']]},
    {k:'floor', t:'Flooring scope of work', trade:'Flooring', pages:4, d:'Carpet removal, subfloor prep, LVP and engineered hardwood install, transitions and baseboard.',
     sec:[['Remove','Remove carpet, pad and tack strip. Pull staples. Haul away.'],['Prepare','Check the subfloor for flat within 3/16 in over 10 ft. Fill or grind as needed.'],['Install','Acclimate the plank 48 hours. Leave the expansion gap. Stagger end joints.'],['Close out','Install transitions, then baseboard or shoe molding. Vacuum and wipe.']]},
    {k:'paint', t:'Painting scope of work', trade:'Painting', pages:3, d:'Interior walls and ceilings, trim and doors, exterior trim. Prep, prime and two coats.',
     sec:[['Prepare','Move furniture to the middle and cover. Patch holes, sand, caulk trim gaps.'],['Prime','Spot prime patches and stains. Full prime on color changes from dark to light.'],['Paint','Two coats on walls. Ceilings flat white. Trim and doors semi-gloss.'],['Close out','Touch up, remove tape, return furniture, clean.']]},
    {k:'doors', t:'Doors and trim scope of work', trade:'Doors, carpentry', pages:3, d:'Interior door slab replacement, hardware, baseboard and casing.',
     sec:[['Doors','Measure each opening. Hang new slabs on existing jambs where sound. Mortise hinges, drill for hardware.'],['Trim','Remove old baseboard carefully. Cope inside corners. Nail to studs, fill and caulk.'],['Close out','Adjust each door to swing and latch. Paint or touch up.']]},
    {k:'elec', t:'Lighting scope of work', trade:'Electrical', pages:3, d:'Fixture replacement, recessed lights on a dimmer. Mechanicals and the panel are excluded.',
     sec:[['Before work','Confirm the circuit and box rating. The panel is out of scope: refer any concern to a licensed electrician.'],['Fixtures','Replace fixtures on existing boxes. Add recessed lights with IC-rated housings where the plan calls for them.'],['Close out','Test every switch and dimmer. Patch and paint around new openings.']]}
  ];

  RI.RATES = [
    ['LVP flooring','Remove carpet, install plank','sq ft',6.5,10.5,600,100,2000,10],
    ['Interior painting','Walls, two coats, normal prep','sq ft',2.1,3.9,3000,200,6000,50],
    ['Hardwood refinish','Sand and finish','sq ft',4.5,7.0,500,100,2000,10],
    ['Baseboard','Primed pine, installed and painted','linear ft',5.0,8.5,300,20,800,10],
    ['Cabinet refinish','Fronts and boxes','linear ft',160,290,22,6,50,1],
    ['Interior door','Slab replaced, hardware included','each',310,560,8,1,20,1],
    ['Bath vanity','30 in, with top and faucet','each',1100,1900,1,1,4,1],
    ['Light fixture','Replace, standard height','each',150,270,10,1,30,1]
  ];

  RI.AREAS = {
    'clinton-township': {name:'Clinton Township', county:'Macomb County', img:'split-level.jpg', w:1280, h:960,
      alt:'A split-level house with brick on the lower level and a two-car garage', cap:'A split-level house, a type common in Clinton Township subdivisions.',
      blurb:'Brick ranches and colonials from the 1970s on, on curving subdivision streets.',
      intro:['Clinton Township grew mostly from the 1970s on: brick ranches and colonials on curving subdivision streets, with older houses near the Clinton River and Mount Clemens.',
             'Houses from the 1980s and 1990s often have oak cabinets, laminate counters, builder-grade carpet and brass fixtures that are sound but dated. That is where the Standard goal usually spends the most. Roofs and furnaces are covered as guidance, not priced.'],
      types:['brick-ranch','colonial','tri-level']},
    'dearborn': {name:'Dearborn', county:'Wayne County', img:'dearborn-house.jpg', w:1280, h:853,
      alt:'Two-story brick house with a wide front porch on a tree-lined street in Dearborn', cap:'A brick house with a front porch in Dearborn.',
      blurb:'Brick bungalows and colonials from the 1920s to the 1950s, close to the street.',
      intro:['Much of Dearborn was built between the 1920s and the 1950s: brick bungalows, colonials and foursquares on narrow lots, many with front porches and detached garages.',
             'Houses of that age often have plaster walls, hardwood under carpet, a small original kitchen and a single full bath. Plaster repair before paint, hardwood refinishing and kitchen and bath updates are the lines this page prices most. Roofs and furnaces are covered as guidance, not priced.'],
      types:['bungalow','colonial','brick-ranch']},
    'livonia': {name:'Livonia', county:'Wayne County', img:'livonia-corner.jpg', w:1280, h:606,
      alt:'Two-story brick house with dormers on a corner lot in the Rosedale Gardens neighborhood of Livonia', cap:'Rosedale Gardens, Livonia.',
      blurb:'Ranches, colonials and tri-levels built in the two decades after 1950.',
      intro:['Most of Livonia was built in the two decades after 1950: brick and aluminum-sided ranches, then colonials and tri-levels on quiet blocks. Older pockets such as Rosedale Gardens hold brick houses from the 1920s to the 1940s.',
             'Houses of that age often still have their original oak or laminate kitchens, carpet over hardwood, hollow-core doors and basements that were finished decades ago. Those are the lines this page prices. Roofs and furnaces are covered as guidance, not priced.'],
      types:['brick-ranch','colonial','tri-level']},
    'sterling-heights': {name:'Sterling Heights', county:'Macomb County', img:'colonial.jpg', w:1280, h:853,
      alt:'Two-story colonial house with wood siding, a green front door and a driveway', cap:'A two-story colonial, one of the common house types in Sterling Heights.',
      blurb:'Ranches, colonials and tri-levels from the 1960s to the 1990s.',
      intro:['Most houses in Sterling Heights were built from the 1960s to the 1990s: brick ranches, colonials and tri-levels on suburban streets with mature trees.',
             'The work that comes up most is a kitchen update, carpet to LVP on the main floor, interior paint and doors, and basements that were finished in the 1980s or 1990s. Roofs and furnaces are covered as guidance, not priced.'],
      types:['brick-ranch','colonial','tri-level']},
    'warren': {name:'Warren', county:'Macomb County', img:'brick-ranch.jpg', w:1280, h:851,
      alt:'Single-story brick ranch house with an attached garage and a lawn in front', cap:'A brick ranch, one of the most common house types in Warren.',
      blurb:'Postwar brick ranches and bungalows on modest lots.',
      intro:['Warren grew quickly after the Second World War, and most of its houses date from the late 1940s to the 1960s: brick ranches and bungalows on modest lots, with colonials and newer ranches further north.',
             'Many still have hardwood under carpet, plaster or early drywall, a small kitchen and one full bath, and a basement finished long ago. Flooring, kitchens and bathrooms are the lines this page prices most. Roofs and furnaces are covered as guidance, not priced.'],
      types:['brick-ranch','bungalow','colonial']}
  };

  RI.TYPES = {
    'brick-ranch': {name:'Brick ranch', zones:[['Kitchen cabinets','list',120,92,40,16],['Carpet to LVP','sliders',22,112,150,8],['Doors and trim','house',96,96,12,24],['Old basement finish','ruler',22,120,150,14]], img:'brick-ranch.jpg', alt:'Single-story brick ranch house with an attached garage',
      short:'One story, usually on a full basement. Built from the 1950s to the 1990s.',
      needs:'Kitchen cabinets refinished or replaced, carpet to LVP, interior doors and trim, a basement finished long ago.',
      era:'1950s to 1990s', stories:'One', basement:'Usually full', size:'1,000 to 1,800 sq ft',
      intro:['The brick ranch is one of the most common houses in older suburbs. Everything is on one floor, usually over a full basement, with an attached or detached garage.',
             'Because the shell is brick, the work is almost always inside: kitchens and baths that are sound but dated, carpet over hardwood or slab, hollow-core doors, and a basement finished decades ago.'],
      work:[0,1,4,5,3,6],
      faq:[['What does a Standard update usually include in a ranch?','Most often: cabinets refinished, a new countertop, carpet replaced with LVP on the main floor, all walls painted and dated light fixtures replaced. Your own estimate lists each line for your house.'],
           ['Is there hardwood under the carpet?','Often, in ranches from the 1950s and 1960s. We only count it if a photo shows it, for example at a floor vent or a closet edge. Otherwise the flooring line is based on what we can see.'],
           ['Do you price the basement?','Yes, if it is finished and photographed. Above-grade and basement areas are always kept apart.']]},
    'bungalow': {name:'Bungalow', zones:[['Hardwood refinished','sliders',50,112,140,8],['Plaster repair, then paint','tool',56,92,128,18],['Upstairs bath','dot',98,52,44,18]], img:'livonia-street.jpg', alt:'Brick houses with steep roofs and front porches on a tree-lined street',
      short:'One and a half stories, with smaller upstairs rooms under a sloped roof. Mostly 1920s to 1950s.',
      needs:'Hardwood refinished, plaster walls repaired before paint, an older bathroom updated.',
      era:'1920s to 1950s', stories:'One and a half', basement:'Usually full, unfinished', size:'900 to 1,500 sq ft',
      intro:['Bungalows fill the older neighborhoods of Detroit, Dearborn, Ferndale and Royal Oak. The main floor holds the living rooms and often one bedroom; the upstairs rooms sit under the slope of the roof.',
             'They often have original hardwood, plaster walls and trim worth keeping. The work tends to be refinishing and repair rather than replacing, which suits the Essential and Standard goals.'],
      work:[2,1,3,5,6,7],
      faq:[['Can plaster walls just be painted?','Usually after repair. Cracks and loose areas are patched first. When a photo shows damage we cannot size, the line shows unverified instead of guessing.'],
           ['How are sloped upstairs ceilings counted?','Wall and ceiling areas come from your sizes when you give them, then from room patterns. A typical size is never shown as a measurement, and it widens the range.'],
           ['Is a bungalow more expensive to update?','Not always. Refinishing hardwood and keeping good trim often costs less than replacing. Your estimate shows each choice under each goal.']]},
    'colonial': {name:'Colonial', zones:[['Stair and bedroom carpet','sliders',56,48,128,30],['Oak kitchen','list',140,82,44,38],['Two or more baths','dot',104,56,32,22]], img:'colonial.jpg', alt:'Two-story colonial house with wood siding and a green front door',
      short:'Two stories, bedrooms upstairs, often a family room off the kitchen.',
      needs:'Carpet on stairs and bedrooms replaced, oak kitchen updated, two or more baths refreshed.',
      era:'1940s to 2000s', stories:'Two', basement:'Usually full', size:'1,600 to 2,800 sq ft',
      intro:['The colonial puts the living spaces downstairs and three or four bedrooms upstairs, usually with two or more bathrooms. Many in the suburbs date from the 1970s to the 1990s.',
             'Typical work is the carpet on the stairs and in the bedrooms, an oak kitchen that is sound but dated, and two or three bathrooms with original vanities and fixtures.'],
      work:[0,1,4,6,5,7],
      faq:[['Are stairs counted with the flooring?','Stairs and landings are counted apart, per tread, because the work is different from a flat floor.'],
           ['Will all bathrooms be priced?','Every bathroom with a photo is priced. A bathroom without photos is listed as unverified and left out of the total, which is then labeled partial.'],
           ['Can I see just the kitchen?','In the full presentation you can turn items on and off, and the totals update at once.']]},
    'tri-level': {name:'Tri-level', zones:[['Stairs and landings','ruler',106,58,18,62],['Lower-level paneling','tool',20,88,88,32],['Dated lighting','dot',124,76,96,44]], img:'split-level.jpg', alt:'A split-level house with a brick lower level and a garage under the main floor',
      short:'Three short levels joined by half flights of stairs. Mostly 1960s and 1970s.',
      needs:'Stairs and landings reworked with the flooring, dated lower-level paneling removed, lighting updated.',
      era:'1960s and 1970s', stories:'Three short levels', basement:'Partial, often a lower family room', size:'1,300 to 2,200 sq ft',
      intro:['Tri-levels and split-levels were built in large numbers across Livonia, Sterling Heights and Clinton Township in the 1960s and 1970s. The living room and kitchen sit on one level, bedrooms half a flight up, and a family room half a flight down.',
             'The lower level often still has wood paneling and older carpet. Short stair runs between levels are counted apart from the floors, and lighting is often the cheapest big change.'],
      work:[0,1,3,7,5,6],
      faq:[['How is paneling handled?','If a photo shows paneling, the Standard goal usually replaces it with painted drywall. If the photo is too dark to judge, the line shows unverified.'],
           ['Are the short stair runs priced?','Yes. Each run is counted per tread and priced with the flooring choice for that goal.'],
           ['Is the lower level counted as basement?','Only the part below grade. Above-grade and below-grade areas are always kept apart.']]}
  };
})();
