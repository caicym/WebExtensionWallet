var nebulas = require("nebulas"),
    Account = nebulas.Account,
    neb = new nebulas.Neb(),
    Unit = nebulas.Unit;
hash = location.search.slice(1),
    validateAll = uiBlock.validate();

uiBlock.insert({
    footer: ".footer",
    header: ".header",
    logoMain: ".logo-main",
    numberComma: ".number-comma"
});

$("#btn_done").hide()

neb.setRequest(new nebulas.HttpRequest(localSave.getItem("apiPrefix") || "https://testnet.nebulas.io/"));
$("#btn").on("click", onClickBtn);
$("#btn_done").on("click", function () {
    window.close()
});

if (hash) {
    $("#input").val(hash);
    $("#btn").trigger("click");
}

var interval = 0;
function setAutoCheck() {
    if (interval === 1000)
        return

    if ($(".status").text() !== "success") {
        interval = 1000
        var second = 15
        var number = second
        var countDown = setInterval(function () {
            if ($(".status").text() === "success" ||
                $(".status").text() === "fail") {
                clearInterval(countDown)
                //$("#counterDown").remove()
                $("#btn").hide()
                $("#btn_done").show()
            }

            if ($("#counterDown").length > 0) {
                $("#counterDown").text(' (' + number + ')')
            } else {
                var spanTag = document.createElement("span");
                spanTag.id = "counterDown";
                spanTag.innerHTML = '(' + number + ')';
                $("#btn").append(spanTag);
            }

            if (number === 0) {
                number = second
                onClickBtn()
            }

            number--;

        }, interval)
    }

}

function onClickBtn() {
    var addr = $("#input").val();

    if (validateAll()) {
        $(".modal.loading").modal("show");

        neb.api.getTransactionReceipt(addr)
            .then(doneGetTransactionReceipt)
            .catch(function (o) {
                $(".modal.loading").modal("hide");

                bootbox.dialog({
                    backdrop: true,
                    message: i18n.apiErrorToText(o.message),
                    onEscape: true,
                    size: "large",
                    title: "Error"
                });
            });
    } else {
        $(".errmsg").removeClass("active1");
        setTimeout(function () {
            $(".errmsg").addClass("active1");
        }, 2000);
    }
    setAutoCheck()
}

function doneGetTransactionReceipt(o) {

    /*
        if (o.data) {
            data = atob(o.data);
            lang = Prism.languages.javascript;

            if (o.type == "binary")
                s = data;
            else if (o.type == "deploy")
                s = Prism.highlight(js_beautify(JSON.parse(data).Source), lang);
            else if (o.type == "call")
                s = Prism.highlight(js_beautify(data), lang);
            else
                s = "0x0";

            $("#code").html(s);
        }
    */
    $(".modal.loading").modal("hide");

    $("#info").removeClass("active1");
    var payload = base64ToArrayBuffer(o.data);
    fromAddress = o.to;
    // 84 -> 'T', 73 --> 'I'
    if ((payload[0] === 84 && payload[1] === 73) || (payload[0] === 0xAE && payload[1] === 0x01)) {
        var contractAddr = Decodeuint8arr(payload.subarray(2));
        // var contractAddr = "n1xjfx3tBRerdE1cwkB4QebPU4yY8yEh6tH"
        neb.api.call({
            chainID: localSave.getItem("chainId"),
            from: o.to,
            to: contractAddr,
            value: 0,
            nonce: 12,
            gasPrice: 1000000,
            gasLimit: 2000000,
            contract: {
                function: "getTIE",
                args: "[\"" + o.to + "\"]",
            }
        }).then(function (o) {
            console.log(o.result)
            var content = JSON.parse(o.result)
            if (!!content.payload) {
                $("#atlasp_tie").replaceWith(content.payload);
            } else {
                $("#atlasp_tie").replaceWith(content);
            }
        }).catch(function (o) {
            $("#payload").append('<textarea name=code id=code cols=40 rows=6 wrap=virtual disabled></textarea>');
            $("#code").text("call error: " + o);
        });
        // $("#code").text(contractAddr + " ### " + fromAddress);
    } else {
        $(".tx_hash").text(o.hash);
    }
    $(".contract_addr").text(o.contract_address);
    $(".status").text(o.status == 1 ? "success" : (o.status == 0 ? "fail" : "pending"));
    $(".status").css("color", o.status == 1 ? "green" : (o.status == 0 ? "red" : "blue"));
    $(".from_address").text(o.from);
    $(".to_address").text(o.to);
    $(".nonce").text(o.nonce);

    $(".amount input").val(o.value).trigger("input");
    $(".gas-limit input").val(o.gas_limit).trigger("input");
    $(".gas-price input").val(o.gas_price).trigger("input");
    $(".gas-used input").val(o.gas_used).trigger("input");
}

function doneGetCallContract(o) {
    $("#payload").append('<textarea name=code id=code cols=40 rows=6 wrap=virtual disabled></textarea>');
    $("#code").text("Result: " + o.result + "  Err: " + o.execute_err);
}

function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

/**
 * Convert an Uint8Array into a string.
 *
 * @returns {String}
 */
function Decodeuint8arr(uint8array) {
    return new TextDecoder("utf-8").decode(uint8array);
}

/**
 * Convert a string into a Uint8Array.
 *
 * @returns {Uint8Array}
 */
function Encodeuint8arr(myString) {
    return new TextEncoder("utf-8").encode(myString);
}

/**
 * altlasp code
 */
var altlaspAccount;
var altlaspAccAddress;
var altlaspContract;
var altlaspFunc;
var altlaspArgs;
var altlaspNonce = -1;
$('#modal-altlasp-call').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget); // Button that triggered the modal
    var contract = button.data('contract'); // Extract info from data-* attributes
    var func = button.data("func");
    var args = button.data("args");
    altlaspFunc = func;
    altlaspArgs = args;
    altlaspContract = contract;

    chrome.storage.local.get(['keyInfo'], function (result) {
        console.log('altlasp keyInfo Value is :' + JSON.stringify(result.keyInfo));
        result = JSON.parse(result.keyInfo);

        if (!!result) {
            var fileJson = result.fileJson;
            var password = result.password;
            var account = Account.fromAddress(fileJson.address)
            account.fromKey(fileJson, password);
            altlaspAccAddress = account.getAddressString();
            altlaspAccount = account;

            neb.api.getAccountState(altlaspAccAddress)
                .then(function (resp) {
                    var nas = require("nebulas").Unit.fromBasic(resp.balance, "nas").toNumber();
                    console.log("\tbalance: " + nas + ", nonce: " + resp.nonce);
                    altlaspNonce = parseInt(resp.nonce || 0) + 1;

                    console.log("altlasp-call: " + contract + " args: " + JSON.stringify(args) + " addr: " + altlaspAccAddress);
                    $('#altlasp_from_addr').val(altlaspAccAddress).trigger("input");
                    $('#altlasp_contract_addr').val(contract).trigger("input");
                    $('#altlasp_contract_args').val(JSON.stringify({ "Function": func, "Args": JSON.stringify(args) })).trigger("input");

                })
                .catch(function (e) {
                    // this catches e thrown by nebulas.js!neb
                    bootbox.dialog({
                        backdrop: true,
                        onEscape: true,
                        message: i18n.apiErrorToText(e.message),
                        size: "large",
                        title: "Error"
                    });
                });
        } else {
            if (altlaspNonce == -1) {
                console.log("get keyInfo or getAccountState error");
                return;
            }
        }
    });
});

$('#altlasp-btn-confirm').on("click", onClickAltlaspBtn);
function onClickAltlaspBtn() {
    console.log("call onClickAltlaspBtn" + altlaspContract + " " + altlaspFunc + " " + altlaspArgs);
    if (altlaspNonce == -1) {
        console.log("onClickAltlaspBtn error");
        return;
    }
    var tx = new nebulas.Transaction({
        chainID: parseInt(localSave.getItem("chainId")),
        from: altlaspAccount,
        to: altlaspContract,
        value: 0,
        nonce: altlaspNonce,
        gasPrice: 1000000,
        gasLimit: 2000000,
        contract: {
            function: altlaspFunc,
            args: JSON.stringify(altlaspArgs),
        }
    });
    tx.signTransaction();

    console.log("tx raw: " + tx.toString());
    console.log("tx signed: " + tx.toProtoString());
    neb.api.sendRawTransaction(tx.toProtoString())
        .then(function (resp) {
            console.log("sendRawTransaction resp: " + JSON.stringify(resp));
            $('#altlasp-btn-select1').prop("disabled", true);
            $('#altlasp-btn-select2').prop("disabled", true);
            $('#atlaspSecondModal').modal('show');
        })
}