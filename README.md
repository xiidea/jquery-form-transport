jquery-form-transport
=====================

Its an ajaxTransport of Jquery library that allow form submitting

Key Features
============
* As simple as calling jquery ajax function
* Minimum configuration option
* Cross domain communication using name transport



USES
====
Sample code for ajaxTransport of Jquery library

```javascript
    $.post('form_id',{ name: "John", location: "Boston" }, function(data){
        //Handle the response data

    },'form html');

```

or

```javascript
 $.ajax({
        form: 'form_id',
        url: "post.php",
        formData: { name: "John", location: "Boston" },
        dataType: 'form html',
        success:function(data){
            //Handle The response data
        }
    });
```

