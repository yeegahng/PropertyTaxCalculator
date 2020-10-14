class Property {
    constructor(name="", price=0, type="", area="", stake=0) {
        this.name = name; ///optional, shall be 'Property {N}' unless specified
        this.price = price; ///positive integer
        this.type = type; ///Residential, Secondary
        this.area = area; ///Normal, Supervision, Speculation
        this.stake = stake; ///0~100 in percentile integer
        this.isUtilityTaxExempted = false;
    }
}

function showDOMInfo() {
    clear(debugView)
    print(debugView, "[Debug Info]<br>item-field count: " + items.length);
    for (let i=0; i<items.length; i++) {
        printline(debugView, items[i].className + i + " child count: " + items[i].childElementCount);
        if (items[i].className === "item-field") {
            //print(debugView, "item-field #" + i + " childNode length: " + items[i].childNodes.length + "<br>");
            // for (n=0; n<items[i].childNodes.length; n++) {
            //     print(debugView, "childNode" + n + ": " + items[i].childNodes[n] + items[i].childNodes[n].textContent + "<br>");
            // }
            for (let n=0; n<items[i].children.length; n++) {
                printline(debugView, "__child" + n + " content: " + items[i].children[n] + items[i].children[n].textContent);
                printline(debugView, "__child" + n + " nodeName: " + items[i].children[n].nodeName);
                printline(debugView, "__child" + n + " value: " + items[i].children[n].value);
            }
        }
    }
}

function addProperty(price = 0) {
    let newPropertyId = items.length + 1;
    print(propertyView, '<div class="item-field">\
                            <label class="item-label">Property ' + newPropertyId + ':</label>\
                            <input class="item-input-name">\
                            <input class="item-input-price" value="' + price + '">\
                            <select class="item-input-type" id="propertyType">\
                                <option>Residential</option>\
                                <option>Secondary</option>\
                            </select>\
                            <select class="item-input-area" id="propertyArea">\
                                <option>Normal</option>\
                                <option>Supervision</option>\
                                <option>Speculation</option>\
                            </select>\
                            <input class="item-input-stake">\
                            <input utility-tax-exemption type="checkbox" class="item-input-checkbox">\
                        </div>');
    //document.getElementById("property-list-header").hidden = false;
    document.getElementById("btn-calculate").disabled = false; /// we need property at lease one to calculate.
}

function buildPropertyList(items) {
    printline(outputView, "Total property count: " + items.length);
    let propertyList = [];
    for (p=0; p<items.length; p++) {
        printline(debugView, "items[" + p + "] field count: " + items[p].children.length);
        let property = new Property();
        for (f=0; f<items[p].children.length; f++) {
            print(debugView, "field[" + f + "]: " + items[p].children[f].className);
            printline(debugView, " --> value: " + items[p].children[f].value);
            if (items[p].children[f].className === "item-input-name") {
                property.name = items[p].children[f].value;
                if (property.name === '') property.name = "Property " + (p+1);
            } else if (items[p].children[f].className === "item-input-price") {
                property.price = Math.max(0, parseInt(items[p].children[f].value));
                if (isNaN(property.price)) property.price = -1; /// this item shall be excluded from calculation.
            } else if (items[p].children[f].className === "item-input-type") {
                property.type = items[p].children[f].value;
            } else if (items[p].children[f].className === "item-input-area") {
                property.area = items[p].children[f].value;
            } else if (items[p].children[f].className === "item-input-stake") {
                property.stake = saturate(parseFloat(items[p].children[f].value), 0, 100);
                if (isNaN(property.stake)) property.stake = -1; /// this item shall be excluded from calculation.
            } else if (items[p].children[f].className === "item-input-checkbox") {
                property.isUtilityTaxExempted = items[p].children[f].checked;
                printline(debugView, "isUtilityTaxExempted: " + property.isUtilityTaxExempted);
            } else {
                //WARNING("Invalid data field detected: " + items[p].children[f].textContent) /// we don't WARNING for decoration fields(such as label).
            }
        }
        printline(debugView, "item "+ p + " loop finished:" + f)
        propertyList.push(property);
    }

    for (property of propertyList) {
        printline(debugView, property.name);
        printline(debugView, "price: " + property.price);
        printline(debugView, "type: " + property.type);
        printline(debugView, "area: " + property.area);
        printline(debugView, "stake: " + property.stake);
    }
    return propertyList;
}

function calculate() {
    clear(debugView)
    clear(outputView)

    //1. read property price (offcial)
    let propertyList = buildPropertyList(items);

    // propertyList.forEach(property => {
    //     console.log(property);
    //     printline(debugView, property.name);
    // })

    for (property of propertyList) {
        //small check on validity
        if (!isValidPropertyInfo(property)) {
            printline(outputView, "Skipping: Invalid property info in " + property.name);
            continue;
        }

        //title of output report
        printline(outputView, "<br>=== " + property.name + " ===");

        //derate price over deduction rate(60%)
        printline(outputView, "Property Price Deducted: " + currencyIntToStr(getPriceDeducted(property)));

        //2. get basic tax
        let propertyBasicTax = getBasicTax(property);
        printline(outputView, "Property Basic Tax: " + currencyIntToStr(propertyBasicTax));

        //3. estimate city tax
        let propertyCityTax = getCityTax(property);
        printline(outputView, "Property City Tax: " + currencyIntToStr(propertyCityTax));

        //sum of property tax
        printline(outputView, "① Property Tax Sum: " + currencyIntToStr((propertyBasicTax + propertyCityTax)));

        //4. get public utility tax
        let publicUtilityTax = 0;
        if (property.isUtilityTaxExempted === true) {
            printline(outputView, "② Public Utility Tax Exempted");
        }
        else {
            publicUtilityTax = getPublicUtilityTax(property);
            printline(outputView, "② Public Utility Tax: " + currencyIntToStr(publicUtilityTax));
        }

        //5. estimate local education tax from basic tax * local education tax rate(20%)
        let localEducationTax = getLocalEducationTax(propertyBasicTax);
        printline(outputView, "③ Local Education Tax: " + currencyIntToStr(localEducationTax));

        let netPropertyTax = propertyBasicTax + propertyCityTax + publicUtilityTax + localEducationTax;        
        printline(outputView, "Net Property Tax: " + currencyIntToStr(netPropertyTax));

        let netPropertyTaxPortion = netPropertyTax * property.stake / 100;
        printline(outputView, "→ At stake portion: " + currencyIntToStr(netPropertyTaxPortion));
        if (netPropertyTaxPortion > 100000) ///연납 기준
            printline(outputView, "→ Payment: " + currencyIntToStr(netPropertyTaxPortion / 2));
        else
            printline(outputView, "→ Payment: " + currencyIntToStr(netPropertyTaxPortion));
    }
}
function getPriceDeducted(property) {
    const PROPERTY_PRICE_DEDUCTION_RATE = 0.6;
    return property.price * PROPERTY_PRICE_DEDUCTION_RATE;
}

function getBasicTax(property) {
    const TAX_RATE_SECONDARY = [-1, 0.4, 0];
    const TAX_TABLE_RESIDENTIAL = [
        [60000000, 0.001, 0],
        [150000000, 0.0015, 60000],
        [300000000, 0.0025, 195000],
        [-1, 0.004, 570000]];
    const TABLE_IDX_LEVEL_REF = 0;
    const TABLE_IDX_RATE = 1;
    const TABLE_IDX_OFFSET = 2;

    let taxTable, tIndex;
    /// select rate table
    if (property.type === "Secondary") {
        taxTable = TAX_RATE_SECONDARY;
    } else if (property.type === "Residential") {
        taxTable = TAX_TABLE_RESIDENTIAL;
    } else {
        WARNING("Invalid property type deteced: " + property.type)
        return -1;
    }

    /// find tax rate and offset from the table
    let propertyPriceDeducted = getPriceDeducted(property);
    for (tIndex=0; tIndex<taxTable.length; tIndex++) {
        if (propertyPriceDeducted <= taxTable[tIndex][TABLE_IDX_LEVEL_REF] || taxTable[tIndex][TABLE_IDX_LEVEL_REF] === -1) break;
    }
    let propertyBasicTaxLevelRef;
    if (tIndex === 0) propertyBasicTaxLevelRef = 0;
    else propertyBasicTaxLevelRef = taxTable[tIndex-1][TABLE_IDX_LEVEL_REF];
    let propertyBasicTaxRate = taxTable[tIndex][TABLE_IDX_RATE];
    let propertyBasicTaxOffset = taxTable[tIndex][TABLE_IDX_OFFSET];
    printline(debugView, "[property tax] deducted price: " + propertyPriceDeducted + " level ref: " + propertyBasicTaxLevelRef)
    printline(debugView, "[property tax] tax Rate: " + propertyBasicTaxRate + ", tax Offset: " + propertyBasicTaxOffset);
 
    // estimate basic tax from (derated price - basic tax level ref) * basic tax rate + basic tax offset
    let propertyBasicTax = (propertyPriceDeducted - propertyBasicTaxLevelRef) * propertyBasicTaxRate + propertyBasicTaxOffset;
    printline(debugView, "propertyPriceDeducted: " + propertyPriceDeducted);
    printline(debugView, "propertyBasicTaxLevelRef: " + propertyBasicTaxLevelRef);
    printline(debugView, "propertyBasicTaxRate: " + propertyBasicTaxRate);
    printline(debugView, "propertyBasicTaxOffset: " + propertyBasicTaxOffset);
    printline(debugView, "propertyBasicTax: " + propertyBasicTax);
    return propertyBasicTax;
}

function getCityTax(property) {
    const PROPERTY_CITY_TAX_RATE = 0.0014;
    printline(debugView, "[city tax] tax Rate: " + PROPERTY_CITY_TAX_RATE);
    return getPriceDeducted(property) * PROPERTY_CITY_TAX_RATE;
}

function getPublicUtilityTax(property) {
    const PUBLIC_UTILITY_TAX_TABLE = [
        [6000000, 0.0004, 0],
        [13000000, 0.0005, 2400],
        [26000000, 0.0006, 5900],
        [39000000, 0.0008, 13700],
        [64000000, 0.001, 24100],
        [-1, 0.0012, 49100]];
    const TABLE_IDX_LEVEL_REF = 0;
    const TABLE_IDX_RATE = 1;
    const TABLE_IDX_OFFSET = 2;
    let taxTable = PUBLIC_UTILITY_TAX_TABLE, tIndex;
    let propertyPriceDeducted = getPriceDeducted(property);
    for (tIndex=0; tIndex<taxTable.length; tIndex++) {
        if (propertyPriceDeducted <= taxTable[tIndex][TABLE_IDX_LEVEL_REF] || taxTable[tIndex][TABLE_IDX_LEVEL_REF] === -1) break;
    }    
    let utilityTaxLevelRef;
    if (tIndex === 0) utilityTaxLevelRef = 0;
    else utilityTaxLevelRef = taxTable[tIndex-1][TABLE_IDX_LEVEL_REF];
    let utilityTaxRate = taxTable[tIndex][TABLE_IDX_RATE];
    let utilityTaxOffset = taxTable[tIndex][TABLE_IDX_OFFSET];
    printline(debugView, "[utility tax] deducted price: " + propertyPriceDeducted + " level ref: " + utilityTaxLevelRef)
    printline(debugView, "[utility tax] tax Rate: " + utilityTaxRate + ", tax Offset: " + utilityTaxOffset);

    // estimate basic tax from (derated price - basic tax level ref) * basic tax rate + basic tax offset
    let publicUtilityTax = (propertyPriceDeducted - utilityTaxLevelRef) * utilityTaxRate + utilityTaxOffset;
    return publicUtilityTax;
}

function getLocalEducationTax(propertyBasicTax) {
    const LOCAL_EDUCATION_TAX_RATE = 0.2;
    printline(debugView, "[local education tax] tax Rate: " + LOCAL_EDUCATION_TAX_RATE);
    return propertyBasicTax * LOCAL_EDUCATION_TAX_RATE;
}

function isValidPropertyInfo(property) {
    if (property.price <= 0 || property.stake <= 0) {
        return false;
    } else {
        return true;
    }
}

function numberStrToInt(numberStr) {
    //print(debugView, "input: " + numberStr + "(" + numberStr.type + ")");
    numberStr = numberStr.replaceAll(',', '');
    const numberInt = parseInt(numberStr);
    //printline(debugView,  " -> input refined: " + numberInt + "(" + numberInt.type + ")");
    return numberInt;
}

function getCurrencySymbol(currencyCode="kr") {
    switch (currencyCode) {
        case "kr":
            return "￦";
        case "us":
            return "＄";
        case "eu":
            return "€";
        case "cn":
        case "jp":
            return "￥";
        case "uk":
            return "￡";
    }
}
function currencyIntToStr(numberInt, currencyCode="kr") {
    let numberStr = numberInt.toLocaleString('en', {maximumFractionDigits : 0});
    return getCurrencySymbol("kr") + numberStr;
}

function print(view, text, linefeed=false) {
    view.innerHTML += text;
    if (linefeed === true) {
        view.innerHTML += "<br>"
    }
}

function printline(view, text) {
    print(view, text, true);
}

function WARNING(view, text) {
    printline(outputView, "[WARN]" + text); ///WARNING info should show up on main view
}

function clear(view) {
    view.innerHTML = "";
}

function saturate(val, min, max) {
    return Math.max(0, Math.min(100, val));
}

String.prototype.replaceAll = function(org, dest) {
    return this.split(org).join(dest);
}
const items = document.getElementsByClassName("item-field");
const propertyView = document.getElementById("property-view");
const outputView = document.getElementById("output-view");
const debugView = document.getElementById("debug-view");
debugView.hidden = false;

document.getElementById("btn-calculate").disabled = true;
document.getElementById("btn-show-debuginfo").disabled = false;
document.getElementById("property-list-header").hidden = true; ///TO-DO: this doesn't work!
addProperty(228000000);