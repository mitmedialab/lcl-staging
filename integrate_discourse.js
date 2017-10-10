// Link to location of avatars on discourse meta.
var meta_link = "https://cdn-enterprise.discourse.org/meta";
// Link to the meta discourse instance itself.
var discourse_link = "https://meta.discourse.org/";
/* MAIN */

create_latest_topics_list();

/*     READING JSON      */
function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    };
    rawFile.send(null);
}

function create_posts_list() {
	// Reading sample json
	// taken from https://meta.discourse.org/t/discourse-api-tutorial/17574.json
	// Should be relaced by a call to our instance
	readTextFile("./sample.json", function(text){
	    var data = JSON.parse(text);
	    console.log(data);

	    var formatted = format_posts(data);

	    $('#content').html(formatted);
	});
}

function create_latest_topics_list() {
	// Reading sample json
	// taken from https://meta.discourse.org/latest.json
	// Should be relaced by a call to our instance
	readTextFile("http://lcl-discuss.media.mit.edu/latest.json", function(text){
	// readTextFile("./sample-category.json", function(text){
	    var data = JSON.parse(text);
	    console.log(data);

	    var formatted = format_category(data);

	    $('#content').html(formatted);
	});
}


/*                 Individual Posts         */

/*
* Receives the full JSON content of a topic, and uses it's post_stream
* to display the first 3 posts.
*
* Modifies the view param in the process.
*/
function format_posts(view) {
	// Take only first 3 posts.
	view.post_stream.posts = view.post_stream.posts.slice(0, 3);

	for (var post in view.post_stream.posts) {
	  process_post(view.post_stream.posts[post]);
	}

	// return Mustache.render(
	//   `{{#post_stream}}
	//     {{#posts}}
	//       <div class="mt-4">
	//         <p class="username">{{display_username}}
	//         <img alt="" width="45" height="45" src="{{avatar}}" class="avatar" title="{{username}}">
	//         <p class="created_at">{{created_formatted}} </p>
	//         <p class="title"> {{ topic_slug}}</p>
	//         <p class="reply_count">{{reply_count}} </p>
	//         <p class="category">{{category_id}} </p>
	//         <a class="link" href={{link}}>Open</a>
	//       </div>
	//       {{/posts}}
	//       {{/post_stream}}
	//   `, view);
}

/*
* Receives one post, and modifies some of it's data according to the required view.
* Modifies avatar, date, and adds a link to the post.
*/
function process_post(post) {
	// Either link to user avatars, which requires adding the "meta" link, or just use given link.
	// In both cases, we need to specify the required size (90).
	post.avatar = ((post.avatar_template.search("http") == -1 ) ? meta_link : '') +
	              post.avatar_template.replace('{size}', 90);

	// Format date and time
	post.created_formatted = format_date(post.created_at);

	// Create link to post
	post.link = discourse_link + "t/" + post.topic_slug + "/" +
	            post.topic_id + "/" + post.post_number;
}


/*               Full Cateogry           */

/*
* Receives the full JSON content of a topic, and uses it's post_stream
* to display the first 3 posts.
*
* Modifies the view param in the process.
*/
function format_category(view) {
	// Remove pinned posts
	var topic_list = view.topic_list;
	topic_list.topics = topic_list.topics.filter(x => !x.pinned);
	// Take first 3 posts
	topic_list.topics = topic_list.topics.slice(0, 3);

	var topics = view.topic_list.topics;

	var result = "";

	for (var topic in topics) {
	  process_topic(topics[topic], view);

	  var t = topics[topic];

	  // TODO(morant): Took structure from Meta Discourse - still need a lot of work
    result +=
      '<div data-topic-id="' + t.topic_id +'" class="mt-4 mb-4">\n' +
      '  <div class="topic-poster">\n' +
      '    <a data-user-card="' + t.last_poster_username + '" href="/u/' + t.last_poster_username + '" class="">\n' +
      '      <img alt="" width="45" height="45" src="' + t.avatar + '" class="avatar" title="' + t.last_poster_username + '">\n' +
      '    </a>\n' +
      '  </div>\n' +
      '  <div class="main-link">\n' +
      '    <div class="top-row">\n' +
      '      <a href="' + t.link + '" class="title">' + t.title + '</a>\n' +
      '    </div>\n' +
      '    <div class="bottom-row">\n' +
      '      <a class="badge-wrapper bullet" href="/c/' + t.category + '">\n' +
      '        <span class="badge-category-bg" style="background-color: #CEA9A9;"></span>\n' +
      '        <span data-drop-close="true" class="badge-category clear-badge">' + t.category_id + '</span>\n' +
      '      </a>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="topic-stats">\n' +
      '    <div class="num posts-map posts heatmap-" title="This topic has ' + t.reply_count + ' replies">\n' +
      '      <a href="" class="posts-map badge-posts heatmap-">\n' +
      '        <span class="number">' + t.reply_count + '</span>\n' +
      '      </a>\n' +
      '    </div>\n' +
      '  <div class="topic-last-activity">\n' +
      '    <a href="' + t.last_response_link + '">\n' +
      '    <span class="relative-date" data-time="' + t.bumped_at + '" data-format="tiny">Last reply: ' + t.bumped_formatted + '</span></a>' +
      '  </div>\n' +
      '</div>\n';
  }
  return result;
}

/*
* Receives one post, and modifies some of it's data according to the required view.
* Modifies avatar, date, and adds a link to the post.
*/
function process_topic(topic, view) {
	//TODO(morant): topic doesn't have the user's display name...
	topic.display_username = topic.last_poster_username;

	// Either link to user avatars, which requires adding the "meta" link, or just use given link.
	// In both cases, we need to specify the required size (90).
	var user = view.users.find(x => x.username == topic.last_poster_username);
	if (user) {
		var template = user.avatar_template;
		topic.avatar = ((template.search("http") == -1 ) ? meta_link : '') +
		               template.replace('{size}', 90);
	}

	// Format date and time
	topic.created_formatted = format_date(topic.created_at);
	topic.bumped_formatted = format_date(topic.bumped_at);


	// Create link to topic
	topic.link = discourse_link + "t/" + topic.slug + "/" + topic.id;
	topic.last_response_link = topic.link + "/" + topic.highest_post_number;
}


/*                Helper Functions         */

function format_date(date) {
	// TODO(morant): Do we want to show difference from now? It seems complicated in JS.
	// But this is also weird, becuase it ignores timezones.
	var date_obj  = new Date(date);

  return date_obj.toDateString() + ', ' +
	  ((date_obj.getHours() < 10) ? '0' : '') + date_obj.getHours() + ':' +
	  ((date_obj.getMinutes() < 10) ? '0' : '')  + date_obj.getMinutes();
}
