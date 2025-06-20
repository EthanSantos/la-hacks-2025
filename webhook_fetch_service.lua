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
		
		-- Check for moderation action
		if responseData.moderation_action then
			local action = responseData.moderation_action:lower()
			local reason = responseData.moderation_reason or "Inappropriate behavior"
			
			warn("Moderation Action:", action)
			warn("Reason:", reason)
			
			if action == "kick" then
				warn("Kicking player:", plr.Name)
				plr:Kick("KICKED: " .. reason .. "\n\nYou have been kicked for violating community guidelines.")
			elseif action == "warning" then
				warn("Warning player:", plr.Name)
				warn("WARNING for", plr.Name, ":", reason)
			elseif action == "ban" then
				warn("Banning player:", plr.Name)
				plr:Kick("BANNED: " .. reason .. "\n\nYou have been banned for serious violations.")
			end
		else
			warn("No moderation action required")
		end
		
		return responseData
	else
		warn("AI Analysis Request Failed: " .. tostring(response), response)
		return {
			sentiment_score = 5;
			emotion = 1;
		}
	end
end