FROM httpd:2.4

RUN echo '<html> <head> <title>Amazon ECS Sample App</title> <style>body {margin-top: 40px; background-color: $BG_COLOR;} </style> </head><body> <div style=color:white;text-align:center> <h1>Amazon ECS Sample App</h1> <h2>Congratulations!</h2> <p>Your application is now running on a container in Amazon ECS.</p> </div></body></html>' >  /usr/local/apache2/htdocs/index.html
EXPOSE 80
CMD ["httpd-foreground"]


