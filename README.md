# cobweb-plugin

Date: July, 2015

- The cobweb.js is a decorative plugin coded in Javascript with HTML5 Canvas. 
- The plugin has multiple options, and it is easly callable with a single line of code jQuery.
- Responsive to window resizing, the design changes interacting with the cursor.

See here an example: http://gus42.github.io/cobweb-plugin/

How to call the cobweb:
$("div").plugCob();

You can also add options.
For example, if you want add a cobweb to a div with 'backgound-color: red' I suggest to set the color of cobweb to red with a random opacity. You can also decide how many points you want in your cobweb and how large they are.

'''
$("div").plugCob({ color: "red",opacity: "random", colorLine: "red", opacityLine: "random", countPoints: 6, radiusPoint: 7});
'''

Author: Francesco Gusella

Contacts: gus815@gmail.com
