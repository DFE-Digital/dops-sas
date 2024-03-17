// initialize the iFrame resizer
var iframe = document.querySelectorAll('[data-module="app-iframe"]');
for(let i=0; i<iframe.length; i++){
    iframe[i].onload = function() {
    iframe[i].style.height = 20 + iframe[i].contentWindow.document.body.scrollHeight + 'px';
    }
}