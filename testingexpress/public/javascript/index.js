var step = 1;
var etsy_prod = null;
var hp_food = null;

function request_etsy_prod()
{
	$.ajax({
		url: '/etsy/50',
		async: 'true',
		dataType: 'json',
		timeout: 8000, 
		success: function ( data )
		{ 
			etsy_prod = data;
		}
	});
}

function request_hp_food()
{
	$.ajax({
		url: '/hp/New+York/food/1',
		async: 'true',
		dataType: 'json',
		timeout: 8000, 
		success: function ( data )
		{ 
			hp_food = data;
		}
	})
}

function handle_steps()
{
		if (step-1 >= 1)
			$('#step'+(step-1)).animate({color:'#999'}, 'fast');

		$("#step" + step).animate({color:'#000'}, 'fast');

		if (step+1 <= 5)
			$('#step'+(step+1)).animate({color:'#999'}, 'fast');
}

function toggle_pagination()
{
	if (step == 1)
	{
		$('#next-button').fadeTo('normal', 1);
		$('#prev-button').fadeTo('normal', 0);
	}
	else if (step == 5)
	{
		$('#next-button').fadeTo('normal', 0);
	}
	else
	{
		$('#prev-button').fadeTo('normal', 1);
		$('#next-button').fadeTo('normal', 1);
	}
}

$(document).ready(function() { 
	toggle_pagination();
	handle_steps();
	
	$('#next-button').click(function() {
		if (step != 5)
			step++;
		toggle_pagination();
		handle_steps();
	});
	
	$('#prev-button').click(function() {
		if (step != 1)
			step--;
		toggle_pagination();
		handle_steps();
	});
	
	request_hp_food();	
});