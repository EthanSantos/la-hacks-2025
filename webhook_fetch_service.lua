function WebhookFetchService.FetchFromMessage(data)
	local message, plr = data.Message, data.Player
	
	warn('Sending', data)
	local requestBody = HttpService:JSONEncode({
		message = message,
		message_id = tostring(os.time()) ,
		player_name = plr.Name,
		player_id = plr.UserId
	})

	local headers = {
		--["Content-Type"] = "application/json",
		["X-API-Key"] = PrivateKeys.Webhooks.API_KEY,
		["x-vercel-protection-bypass"] = PrivateKeys.Webhooks.VercelProtectionBypass
	}

	local success, response = pcall(function()
		return HttpService:PostAsync(
			PrivateKeys.Webhooks.API_URL, 
			requestBody, 
			Enum.HttpContentType.ApplicationJson, 
			false, 
			headers
		)
	end)

	if success then
		local responseData = HttpService:JSONDecode(response)
		--print(response)
		--print("Message: " .. message)
		--print("Sentiment Score: " .. responseData.sentiment_score)
		warn('Response data', responseData)
		return responseData
	else
		warn("AI Analysis Request Failed: " .. tostring(response), response)
		return {
			sentiment_score = 5;
			emotion = 1;
		}
	end
end