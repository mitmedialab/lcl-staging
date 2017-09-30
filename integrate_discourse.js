function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

// Reading sample json
// taken from https://meta.discourse.org/t/discourse-api-tutorial/17574.json
// Should be relaced by a call to our instance
readTextFile("./sample.json", function(text){
    var data = JSON.parse(text);
    console.log(data);

    var formatted = format_posts(data)

    $('#content').html(formatted);
});

// Link to location of avatars on discourse meta.
var meta_link = "https://cdn-enterprise.discourse.org/meta";
// Link to the meta discourse instance itself.
var discourse_link = "https://meta.discourse.org/"

/*
* Receives the full JSON content of a topic, and uses it's post_stream
* to display the first 3 posts.
*
* Modifies the view param in the process.
*/
function format_posts(view) {
	// Take only first 3 posts.
	view.post_stream.posts = view.post_stream.posts.slice(0, 3);

	for (post in view.post_stream.posts) {
	  process_post(view.post_stream.posts[post])
	}

	return Mustache.render(
	  `{{#post_stream}}
	    {{#posts}}
	      <div class="mt-4">
	        <p class="username">{{display_username}}
	        <img alt="" width="45" height="45" src="{{avatar}}" class="avatar" title="{{username}}">
	        <p class="created_at">{{created_at}} </p>
	        <p class="title"> {{ topic_slug}}</p>
	        <p class="reply_count">{{reply_count}} </p>
	        <p class="category">{{category_id}} </p>
	        <a class="link" href={{link}}>Open</a>
	      </div>
	      {{/posts}}
	      {{/post_stream}}
	  `, view);
}

/*
* Receives one post, and modifies some of it's data according to the required view.
* Modifies avatar, date, and adds a link to the post.
*/
function process_post(post) {
	// Either link to user avatars, which requires adding the "meta" link, or just use given link.
	// In both cases, we need to specify the required size (90).
	post.avatar = ((post.avatar_template.search("http") == -1 ) ? meta_link : '')
	                + post.avatar_template.replace('{size}', 90);

	// Format date and time
	var created_date = new Date(post.created_at)

	post.created_at = created_date.toDateString() + ', ' +
	  ((created_date.getHours() < 10) ? '0' : '') + created_date.getHours() + ':' +
	  ((created_date.getMinutes() < 10) ? '0' : '')  + created_date.getMinutes();

	// Create link to post
	post.link = discourse_link + "t/" + post.topic_slug + "/" +
	            post.topic_id + "/" + post.post_number;
}
