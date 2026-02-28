#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# CurrentPrep Image Bank Downloader
# Downloads ~300 royalty-free images organized by UPSC syllabus category
# Uses loremflickr.com (free, keyword-based Flickr images)
# ═══════════════════════════════════════════════════════════════════════

set -e

BANK_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/images/bank"
echo "📁 Image Bank: $BANK_DIR"
echo "═══════════════════════════════════════════════════════"

download_images() {
    local category="$1"
    shift
    local keywords=("$@")
    local dir="$BANK_DIR/$category"
    mkdir -p "$dir"

    echo ""
    echo "📂 $category (${#keywords[@]} images)"

    local i=0
    for kw in "${keywords[@]}"; do
        i=$((i + 1))
        local filename="${category}-$(printf '%02d' $i).jpg"
        local filepath="$dir/$filename"

        if [ -f "$filepath" ]; then
            echo "  ✓ $filename (exists)"
            continue
        fi

        # Use loremflickr with lock parameter for deterministic results
        local lock=$((i * 7 + $(echo -n "$category" | cksum | cut -d' ' -f1) % 100))
        local url="https://loremflickr.com/800/500/${kw}?lock=${lock}"

        echo -n "  ⬇ $filename ($kw)..."
        if curl -sL "$url" -o "$filepath" 2>/dev/null; then
            # Verify it's actually an image (not an error page)
            local ftype=$(file -b --mime-type "$filepath" 2>/dev/null || echo "unknown")
            if [[ "$ftype" == image/* ]]; then
                local size=$(stat -f%z "$filepath" 2>/dev/null || stat -c%s "$filepath" 2>/dev/null || echo "?")
                echo " ✓ (${size} bytes)"
            else
                echo " ✗ (not an image, removing)"
                rm -f "$filepath"
            fi
        else
            echo " ✗ (download failed)"
        fi

        # Small delay to be nice to the server
        sleep 0.3
    done
}

echo "Starting image bank download..."
echo "This will download ~300 images (~50MB total)"
echo ""

# ── POLITY (Parliament, Constitution, SC, Elections) ──────────────────
download_images "polity" \
    "indian,parliament,building" \
    "supreme,court,india" \
    "indian,constitution" \
    "election,india,voting" \
    "rajya,sabha,parliament" \
    "lok,sabha,india" \
    "indian,flag,tricolor" \
    "president,india,rashtrapati" \
    "high,court,india" \
    "indian,parliament,democracy" \
    "election,commission,india" \
    "voting,booth,india" \
    "indian,judiciary,law" \
    "constitutional,assembly,india" \
    "governor,raj,bhavan" \
    "state,legislature,assembly" \
    "panchayat,raj,village" \
    "municipal,corporation,india" \
    "political,rally,india" \
    "indian,democracy,people"

# ── GOVERNANCE (Schemes, Digital India, Administration) ───────────────
download_images "governance" \
    "government,office,india" \
    "digital,india,technology" \
    "aadhaar,card,identity" \
    "smart,city,india" \
    "indian,bureaucracy,office" \
    "public,service,india" \
    "egovernance,digital,service" \
    "swachh,bharat,clean" \
    "make,india,manufacturing" \
    "jan,dhan,bank,account" \
    "police,station,india" \
    "indian,railway,train" \
    "public,distribution,ration" \
    "pension,scheme,elderly" \
    "health,scheme,hospital" \
    "skill,development,training" \
    "urban,development,city" \
    "rural,development,village" \
    "infrastructure,highway,india" \
    "welfare,scheme,india"

# ── ECONOMY (RBI, Markets, Banking, Trade) ────────────────────────────
download_images "economy" \
    "reserve,bank,india" \
    "indian,rupee,currency" \
    "stock,market,trading" \
    "banking,finance,india" \
    "gst,tax,india" \
    "budget,india,finance" \
    "indian,economy,growth" \
    "export,import,trade" \
    "startup,india,business" \
    "microfinance,selfhelp,group" \
    "insurance,policy,india" \
    "inflation,prices,market" \
    "coal,mining,industry" \
    "steel,industry,india" \
    "textile,industry,fabric" \
    "oil,refinery,petroleum" \
    "solar,energy,panel" \
    "wind,energy,turbine" \
    "cryptocurrency,digital,finance" \
    "msme,small,business" \
    "foreign,investment,india" \
    "gdp,economic,growth" \
    "poverty,india,rural"

# ── INTERNATIONAL RELATIONS ───────────────────────────────────────────
download_images "ir" \
    "united,nations,assembly" \
    "diplomacy,handshake,flags" \
    "india,china,border" \
    "indo,pacific,ocean" \
    "g20,summit,leaders" \
    "brics,summit,nations" \
    "india,usa,relations" \
    "india,russia,diplomacy" \
    "saarc,south,asia" \
    "asean,summit,asia" \
    "world,trade,organization" \
    "nuclear,deal,agreement" \
    "refugee,migration,crisis" \
    "peacekeeping,united,nations" \
    "sanctions,trade,war" \
    "middle,east,conflict" \
    "climate,summit,paris" \
    "world,bank,development" \
    "imf,international,monetary" \
    "bilateral,treaty,signing"

# ── ENVIRONMENT & ECOLOGY ─────────────────────────────────────────────
download_images "environment" \
    "indian,forest,tiger" \
    "wildlife,sanctuary,india" \
    "river,ganges,india" \
    "air,pollution,smog,delhi" \
    "coral,reef,ocean" \
    "himalayan,glacier,mountain" \
    "mangrove,forest,sundarbans" \
    "solar,panel,renewable" \
    "deforestation,logging,trees" \
    "electric,vehicle,green" \
    "plastic,pollution,ocean" \
    "biodiversity,ecosystem,nature" \
    "wetland,birds,sanctuary" \
    "draught,dry,land" \
    "rainforest,tropical,canopy" \
    "endangered,species,wildlife" \
    "climate,change,global" \
    "water,scarcity,well" \
    "waste,management,recycling" \
    "national,park,india"

# ── SCIENCE & TECHNOLOGY ──────────────────────────────────────────────
download_images "science" \
    "isro,rocket,launch" \
    "space,satellite,orbit" \
    "artificial,intelligence,robot" \
    "quantum,computing,technology" \
    "5g,telecom,tower" \
    "biotechnology,dna,lab" \
    "nuclear,reactor,energy" \
    "supercomputer,data,center" \
    "drone,technology,uav" \
    "nanotechnology,microscope,research" \
    "cybersecurity,hacking,computer" \
    "mars,mission,space" \
    "chandrayaan,moon,india" \
    "blockchain,technology,digital" \
    "semiconductor,chip,circuit" \
    "electric,car,tesla" \
    "3d,printing,manufacturing" \
    "internet,things,iot" \
    "green,hydrogen,fuel" \
    "telescope,astronomy,stars"

# ── SOCIAL JUSTICE ────────────────────────────────────────────────────
download_images "social" \
    "education,school,children,india" \
    "women,empowerment,india" \
    "healthcare,hospital,india" \
    "tribal,people,india" \
    "child,labour,india" \
    "caste,discrimination,social" \
    "old,age,pension,elderly" \
    "disability,rights,wheelchair" \
    "migration,workers,india" \
    "unemployment,youth,india" \
    "literacy,reading,books" \
    "vaccination,health,child" \
    "sanitation,toilet,clean" \
    "nutrition,midday,meal" \
    "gender,equality,women" \
    "domestic,violence,awareness" \
    "ngo,volunteer,service" \
    "slum,urban,poverty" \
    "mental,health,awareness" \
    "population,density,india"

# ── INTERNAL SECURITY ─────────────────────────────────────────────────
download_images "security" \
    "indian,army,soldier" \
    "border,security,force" \
    "navy,warship,india" \
    "air,force,fighter,jet" \
    "crpf,paramilitary,india" \
    "naxal,insurgency,forest" \
    "cybersecurity,threat,shield" \
    "surveillance,cctv,camera" \
    "terrorism,security,alert" \
    "coast,guard,patrol" \
    "radar,defense,military" \
    "missile,defense,india" \
    "intelligence,agency,spy" \
    "drug,trafficking,narcotics" \
    "border,fencing,barbed,wire" \
    "riot,police,security" \
    "ammunition,weapons,defense" \
    "helicopter,military,rescue" \
    "commando,special,forces" \
    "ceasefire,peace,border"

# ── AGRICULTURE ───────────────────────────────────────────────────────
download_images "agriculture" \
    "indian,farmer,paddy,field" \
    "wheat,harvest,golden,field" \
    "tractor,farming,india" \
    "irrigation,canal,agriculture" \
    "organic,farming,vegetable" \
    "mandi,market,produce" \
    "dairy,farming,cow,milk" \
    "fishery,fishing,boat" \
    "sugarcane,field,india" \
    "cotton,farming,harvest" \
    "fertilizer,farm,soil" \
    "crop,insurance,agriculture" \
    "seed,planting,agriculture" \
    "greenhouse,horticulture,plants" \
    "drip,irrigation,water" \
    "cold,storage,warehouse" \
    "food,processing,factory" \
    "sericulture,silk,worm" \
    "tea,plantation,assam" \
    "spice,plantation,kerala"

# ── HISTORY & CULTURE ─────────────────────────────────────────────────
download_images "history" \
    "taj,mahal,agra" \
    "red,fort,delhi" \
    "qutub,minar,delhi" \
    "ajanta,ellora,caves" \
    "hampi,ruins,karnataka" \
    "konark,sun,temple" \
    "khajuraho,temple,sculpture" \
    "mahabodhi,temple,bodh,gaya" \
    "golden,temple,amritsar" \
    "indian,classical,dance" \
    "republic,day,parade" \
    "independence,day,tricolor" \
    "yoga,meditation,india" \
    "indian,music,sitar" \
    "rangoli,festival,diwali" \
    "meenakshi,temple,madurai" \
    "mughal,architecture,india" \
    "buddhist,monastery,ladakh" \
    "warli,art,tribal,painting" \
    "indian,handicraft,pottery"

# ── GEOGRAPHY ─────────────────────────────────────────────────────────
download_images "geography" \
    "himalaya,mountain,snow" \
    "indian,ocean,coastline" \
    "western,ghats,forest" \
    "thar,desert,rajasthan" \
    "ganges,river,varanasi" \
    "deccan,plateau,landscape" \
    "brahmaputra,river,assam" \
    "andaman,nicobar,island" \
    "india,map,geography" \
    "monsoon,rain,india" \
    "earthquake,seismic,zone" \
    "volcanic,island,barren" \
    "delta,river,sundarbans" \
    "coral,island,lakshadweep" \
    "northern,plains,punjab" \
    "kaveri,river,south" \
    "cyclone,weather,storm" \
    "glacier,himalaya,ice" \
    "soil,types,agriculture" \
    "peninsular,india,plateau"

# ── ETHICS & INTEGRITY ────────────────────────────────────────────────
download_images "ethics" \
    "justice,scales,law" \
    "gandhi,nonviolence,peace" \
    "integrity,honesty,hand" \
    "whistleblower,transparency,truth" \
    "corruption,bribery,money" \
    "civil,service,duty" \
    "empathy,compassion,helping" \
    "accountability,governance,audit" \
    "moral,values,ethics" \
    "human,rights,dignity" \
    "public,servant,officer" \
    "lokpal,ombudsman,anticorruption" \
    "RTI,information,transparency" \
    "diversity,inclusion,team" \
    "leadership,guidance,mentor"

# ── DISASTER MANAGEMENT ──────────────────────────────────────────────
download_images "disaster" \
    "flood,rescue,boat,india" \
    "earthquake,damage,rubble" \
    "cyclone,storm,coast,india" \
    "landslide,mountain,debris" \
    "drought,dry,cracked,earth" \
    "tsunami,wave,coastal" \
    "forest,fire,wildfire" \
    "ndrf,rescue,team" \
    "relief,camp,disaster" \
    "flood,damage,village" \
    "hurricane,satellite,weather" \
    "emergency,evacuation,people" \
    "first,aid,medical,rescue" \
    "rebuilding,after,disaster" \
    "early,warning,system"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Image bank download complete!"
echo ""

# Count images
TOTAL=$(find "$BANK_DIR" -name "*.jpg" -type f | wc -l | tr -d ' ')
echo "📊 Total images downloaded: $TOTAL"
echo ""
for dir in "$BANK_DIR"/*/; do
    cat=$(basename "$dir")
    count=$(find "$dir" -name "*.jpg" -type f | wc -l | tr -d ' ')
    echo "  📂 $cat: $count images"
done

echo ""
echo "💡 To add more images:"
echo "   1. Drop .jpg files into public/images/bank/{category}/"
echo "   2. Use naming: {category}-NN.jpg (e.g., polity-21.jpg)"
echo "   3. The system will auto-detect new images"
