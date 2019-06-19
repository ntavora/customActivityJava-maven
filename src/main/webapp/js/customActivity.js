define([
    'postmonger'
], function (
    Postmonger
) {
        'use strict';

        var connection = new Postmonger.Session();
        var authTokens = {};
        var payload = {};
        var inArgument = {};
        var dataextensionId;
        var hasInArguments = false;
        var eventDefinitionKey = "";
        var entrySourceFields = [];
        var esFieldName= []
        var steps = [
            { "label": "Configure Message", "key": "step1" }
        ];
        var currentStep = steps[0];

        $(window).ready(onRender);

        connection.on('initActivity', initialize);
        connection.on('requestedTokens', onGetTokens);
        connection.on('requestedEndpoints', onGetEndpoints);
        connection.on('clickedNext', save);
        connection.on('gotoStep', onGotoStep);
        connection.on('requestedInteraction', requestedInteraction);

        connection.on('requestedTriggerEventDefinition', function (eventDefinitionModel) {
            dataextensionId=eventDefinitionModel.dataextensionId;
            eventDefinitionKey = eventDefinitionModel.eventDefinitionKey;
        });

        connection.on('requestedSchema', function (data) {    //CONNECTION ON
            // save schema
            console.log('*** Schema ***', JSON.stringify(data));
            getDataExtensionSchema(data['schema']);
        });

        function getDataExtensionSchema(data) {
            var field ={}
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                var fieldValue = '{{' + data[index].key +'}}'
                let arr = element.key.split('.');
                esFieldName.push(arr[2]);
                field[arr[2]] = fieldValue;
            }

            entrySourceFields.push(field)
            console.log(entrySourceFields);
        }

        function requestedInteraction(interaction) {
            console.log(interaction);
        }

        function onRender() {
            // Load templates

            // JB will respond the first time 'ready' is called with 'initActivity'
            connection.trigger('requestTriggerEventDefinition');
            connection.trigger('ready');
            connection.trigger('requestTokens');
            connection.trigger('requestEndpoints');
            connection.trigger('requestedInteraction');
            connection.trigger('requestSchema');

        }


        function initialize(data) {

            if (data) {
                payload = data;
            }

            hasInArguments = Boolean(
                payload['arguments'] &&
                payload['arguments'].execute &&
                payload['arguments'].execute.inArguments &&
                payload['arguments'].execute.inArguments.length > 0
            );

            var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};
            // Load attribute sets

            if (inArguments.length > 0 && inArguments[0].campaignName) {
                inArgument = inArguments[0];

            }

            connection.trigger('updateButton', {
                button: 'next',
                text: 'next',
                visible: true
            });

        }

        function onGetTokens(tokens) {
            // Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
            console.log(tokens);
            authTokens = tokens;
        }

        function onGetEndpoints(endpoints) {
            // Response: endpoints = { restHost: <url> } i.e. "rest.s1.qa1.exacttarget.com"
            console.log(endpoints);
        }



        function onGotoStep(step) {
            showStep(step);
            connection.trigger('ready');
        }

        // Navigates to the corresponding step
        function showStep(step, stepIndex) {
            if (stepIndex && !step) {
                step = steps[stepIndex - 1];
            }

            currentStep = step;

            $('.step').hide();

            switch (currentStep.key) {
                case 'step1':
                    $('#step1').show();
                    connection.trigger('updateButton', {
                        button: 'next',
                        test: 'next',
                        enabled: true
                    });
                    connection.trigger('updateButton', {
                        button: 'back',
                        visible: false
                    });
                    break;
                case 'step2':
                    if (ValidateStep1()) {
                        RenderLobVariables();
                        $('#step2').show();
                        connection.trigger('updateButton', {
                            button: 'back',
                            visible: true
                        });
                        connection.trigger('updateButton', {
                            button: 'next',
                            text: 'done',
                            visible: true
                        });
                    }
                    break;
            }
        }


        // Save function
        function save() {
            var inArgs = [];
            var arg = {};                      
            
            arg.fields=esFieldName;
            arg.entrySourceFields = entrySourceFields[entrySourceFields.length-1];
          
            // arg.customApiEventAttribute2 = "{{Event.APIEvent-caa8b3f5-153e-62bd-f16e-4116b2dac024.Name}}";
            inArgs.push(arg);

            payload['arguments'].execute.inArguments = inArgs;
            console.log(payload['outcomes']);
            payload['metaData'].isConfigured = true;

            connection.trigger('updateActivity', payload);
        }


    });