export function init() {
    var srfPoll = {};
    $(document).ready(function() {
        srfPoll.pollControl = new pollController();
        srfPoll.pollControl.init();
    });
}

var pollController = function() {
    var that = this;
    this.polls = {};

    this.init = function() {
        this.loadData();
        this.initObservers();
    };

    this.loadData = function() {
        $('.poll-wrapper').each(function() { // every form
            var pollId = $(this).attr("id");
            $.ajax({
                url: $("#" + pollId).data('src'),
                type: "GET",
                dataType: "json",
                success: function(data) {
                    that.polls[pollId] = new Poll(pollId, data);
                },
                error: function() {
                    // alert('Error occured');
                }
            });
        });
    };

    this.initObservers = function() {
        // also radio!
        var that = this; // todo: click => ...
        // should work on submit submit - not on click!!
        $('.poll-option__radio').on('click', function() { // canton select navigation
            // mark as "clicked"
            $(".poll-option-label[for=" + $(this).attr("id") + "]").addClass("poll-option-label--selected");
            var $poll = $(this).parents(".poll-wrapper")
                , pollId = $poll.attr("id")
                , optionId = $(this).attr("id");

            // this is hopefully temporary ...?
            var qIndex = 0;
            $poll.find("input[type=radio]").each(function (i) {
                // which (nr) one is it?
                if ($(this).attr("id") == optionId) {
                    qIndex = i;
                }
            });
            // tbd: send data .. :)


            // adjust selected vote
            that.polls[pollId].data[qIndex]++;

            // total number of votes
            var total = that.getTotalVotes(that.polls[pollId].data);
            // js mess ...
            $poll.find(".poll").removeClass("poll--setup").addClass("poll--submitted");
            $poll.find(".poll-roundup").show().find("strong").text(total);
            $poll.find(".poll__submit").remove();

            var width, percent = 0;
            $poll.find("li").each(function (i) {
                percent = that.polls[pollId].data[i] / total;
                width = parseInt(percent * 100, 10);
                var $element = $(this);

                // as wrapper in answer mode...
                $element.find(".poll-option-label").remove();
                $element.find(".poll-option-rating__bg-color")
                    .animate({
                        // "background-color": "rgba(201,16,36, " + percent + ")",
                        opacity: percent,
                        width: width + "%"
                    }, 3000, function() {
                        // Animation complete
                    });

                $element.find(".poll-option-rating__percent strong").text(width);
                // the radio is already hidden ... (accessibility???)
            });

        });
    };

    this.getTotalVotes = function (data) {
        var total = 0;
        $.each( data, function( index, value ) {
            total = total + value;
        });
        return total;
    };

    function Poll(id, data) {
        this.id = id;
        this.data = data;
    }
};

